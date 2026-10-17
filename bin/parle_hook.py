#!/usr/bin/env python3
"""Hook Claude Code → démon `parle` (synthèse vocale).
   parle_hook.py prompt   (UserPromptSubmit) coupe la parole en cours, et en mode vocal
                          demande à Claude un résumé oral dans <voix>…</voix>
   parle_hook.py stop     (Stop) envoie à `parle` le <voix> de la dernière réponse"""
import json, os, re, socket, sys, time

CACHE = os.path.expanduser(os.environ.get("AGENTX_VOIX_DIR") or "~/.cache")
SOCK = os.path.join(CACHE, "parle.sock")
FLAG = os.path.join(CACHE, "claude-voix-on")
JOURNAL = os.path.join(CACHE, "claude-voix-journal.jsonl")   # ce qui a été dit, lu par la salle
JOURNAL_MAX = 500
MAX_CHARS = 700   # sans <voix>, on ne lit que le début de la réponse

CONSIGNE = ("Mode vocal actif : ta réponse sera en partie lue à voix haute. Termine-la par un résumé "
            "oral de 1 à 3 phrases entre balises <voix> et </voix> : français parlé naturel, sans code, "
            "sans markdown, sans chemin de fichier ni URL, sans liste. Dis l'essentiel : ce que tu as fait, "
            "le résultat, et ce que tu attends de l'utilisateur s'il y a lieu.")

def send(msg):
    try:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM); s.settimeout(1)
        s.connect(SOCK); s.sendall((json.dumps(msg) + "\n").encode()); s.close()
    except OSError:
        pass   # démon absent : on reste silencieux

def journal(text):
    ligne = json.dumps({"t": time.strftime("%Y-%m-%dT%H:%M:%S"), "texte": text}, ensure_ascii=False) + "\n"
    try:
        with open(JOURNAL, "a+") as f:
            f.write(ligne); f.seek(0); lignes = f.readlines()
        if len(lignes) > JOURNAL_MAX:
            with open(JOURNAL, "w") as f: f.writelines(lignes[-JOURNAL_MAX:])
    except (OSError, ValueError):
        pass   # journal facultatif : le hook ne lève jamais

def last_assistant_text(data):
    if data.get("last_assistant_message"):
        m = data["last_assistant_message"]
        return m if isinstance(m, str) else json.dumps(m)
    texts = []
    try:
        with open(data["transcript_path"]) as f:
            for line in f:
                try: d = json.loads(line)
                except ValueError: continue
                c = (d.get("message") or {}).get("content")
                if d.get("type") == "user" and not d.get("isMeta"):
                    if isinstance(c, str) or (isinstance(c, list) and not any(x.get("type") == "tool_result" for x in c)):
                        texts = []    # nouveau message de l'utilisateur
                elif d.get("type") == "assistant" and isinstance(c, list):
                    texts += [x["text"] for x in c if x.get("type") == "text"]
    except (OSError, KeyError):
        pass
    return "\n\n".join(texts)

def to_speech(text):
    voix = re.findall(r"<voix>(.*?)</voix>", text, re.S)
    if voix:
        text = voix[-1]
    else:
        text = text[:MAX_CHARS * 2]
    text = re.sub(r"```.*?```", " ", text, flags=re.S)                  # blocs de code
    text = re.sub(r"^\s*\|.*$", " ", text, flags=re.M)                  # tableaux
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)               # liens markdown
    text = re.sub(r"https?://\S+", "le lien", text)
    text = re.sub(r"`([^`\n]{1,30})`", lambda m: "" if "/" in m[1] else m[1], text)
    text = re.sub(r"`[^`\n]*`", "", text)
    text = re.sub(r"(?<![\w])[~.]?/[\w./-]+", "", text)                 # chemins de fichiers
    text = re.sub(r"^\s*(#+|[-*+]|\d+\.)\s+", "", text, flags=re.M)   # titres, puces
    text = re.sub(r"[*_]{1,3}([^*_\n]+)[*_]{1,3}", r"\1", text)        # gras / italique
    text = re.sub(r"[\U0001F000-\U0001FFFF☀-➿️]", "", text)  # emojis
    text = re.sub(r"[ \t]+", " ", text).strip()
    if not voix and len(text) > MAX_CHARS:
        cut = text[:MAX_CHARS]
        text = cut[:max(cut.rfind(". "), cut.rfind("? "), cut.rfind("! ")) + 1] or cut
    return text

RELAIS = ("<agent-message", "<task-notification", "[SYSTEM NOTIFICATION", "Another Claude session sent a message")

def est_relais(prompt):
    """Retour d'agent ou notification système relayé en prompt : ne doit pas couper la voix."""
    p = prompt if isinstance(prompt, str) else ""
    return p.lstrip().startswith(RELAIS) or "[Subagent hand-back]" in p[:300]

RE_PROMPT_AGENT = re.compile(r"T\d{3} · projet ")

def premier_user(chemin):
    """Texte du 1er message user du transcript ('' si absent)."""
    with open(chemin) as f:
        for line in f:
            try: d = json.loads(line)
            except ValueError: continue
            if d.get("type") != "user":
                continue
            c = (d.get("message") or {}).get("content")
            if isinstance(c, list):
                c = "".join(x.get("text", "") for x in c if isinstance(x, dict))
            return c if isinstance(c, str) else ""
    return ""

def est_agent(data):
    """Session d'agent AgentX (fiche, prompt « Txxx · projet », ou AGENTX_TID) ; toute erreur ⇒ chef."""
    try:
        if os.environ.get("AGENTX_TID"):
            return True
        sid = data.get("session_id") or ""
        if sid:
            sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
            import agents
            for f in agents.lister():
                fid = f.get("id_session") or ""
                if fid and (sid.startswith(fid) or fid.startswith(sid)):
                    return True
        return bool(RE_PROMPT_AGENT.match(premier_user(data["transcript_path"])))
    except Exception:
        return False

def run():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try: data = json.load(sys.stdin)
    except ValueError: data = {}
    if not isinstance(data, dict):
        data = {}
    if mode not in ("prompt", "stop") or est_agent(data):
        return   # agent détaché : ni consigne, ni coupure, ni voix, ni journal
    if mode == "prompt":
        if not est_relais(data.get("prompt")):
            send({"cmd": "stop"})   # seul l'humain qui écrit coupe la voix
        if os.path.exists(FLAG):
            print(CONSIGNE)
    elif os.path.exists(FLAG):
        text = to_speech(last_assistant_text(data))
        if text:
            send({"cmd": "say", "text": text})
            journal(text)

def main():
    try: run()
    except Exception:
        pass   # le hook ne lève jamais

if __name__ == "__main__":
    main()
