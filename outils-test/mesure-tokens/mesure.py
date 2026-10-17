#!/usr/bin/env python3
"""Coût d'entrée (input+cache_read+cache_creation) et de sortie des transcripts Claude Code, par catégorie d'outil.
Usage : python3 -I mesure.py [--depuis D] [--jusqu D|ISO] [--format md|json] [--dossier DIR]
Agrégats seulement : aucun contenu de transcript n'est restitué."""
import argparse, collections, glob, json, os, re, statistics, sys

VX = r'(?:vx\.py|agentx)\s+([a-z-]+)'
TENUE = {'tache', 'set', 'virer', 'retenir', 'renoncer', 'pack-lint', 'index', 'doctor', 'board', 'ready', 'personnel', 'integrer'}
CATS = ['texte/sans outil', 'vx tenue', 'pack', 'vault autre', 'code/lecture', 'dispatch/Agent', 'vx autre']
CLASSES = ['1re écriture', 'réécriture avant lint', 'réécriture après lint OK', 'réécriture après dispatch']
DEFAUT = os.path.expanduser('~/.claude/projects/-home-sylvain-Documents-AgentX')
FIRST = re.compile(r'\s*T\d{3} · projet')


def cat(name, inp):
    if name in ('Write', 'Edit', 'MultiEdit'):
        p = inp.get('file_path', '')
        if p.endswith('context.md'):
            return 'pack', None
        if 'vault/' in p:
            return 'vault autre', None
        return 'code/lecture', None
    if name == 'Agent':
        return 'dispatch/Agent', None
    if name == 'Bash':
        c = inp.get('command', '')
        m = re.search(VX, c)
        if m:
            s = m.group(1)
            if s == 'dispatch':
                return 'dispatch/Agent', s
            return ('vx tenue' if s in TENUE else 'vx autre'), s
    return 'code/lecture', None


def zero():
    return [0, 0, 0.0]  # appels, sortie, contexte


def en_borne(ts, depuis, jusqu):
    d = ts[:10]
    if depuis and d < depuis:
        return False
    if jusqu:
        return d <= jusqu if len(jusqu) == 10 else ts[:len(jusqu)] <= jusqu
    return True


def analyser(dossier, depuis, jusqu):
    R = {k: collections.defaultdict(zero) for k in ('chef', 'agent')}
    SUB = collections.defaultdict(zero)
    SUBK = {}
    CTX = {'chef': [], 'agent': []}
    OUT = collections.Counter()
    NS = collections.Counter()
    SESS = []
    T5 = collections.defaultdict(zero)          # (classe) -> cumul pack
    T5T = collections.defaultdict(lambda: collections.Counter())  # (proj,tid) -> classes
    T5X = collections.defaultdict(zero)         # contrat/decisions
    for f in sorted(glob.glob(os.path.join(dossier, '*.jsonl'))):
        kind = None
        msgs = collections.OrderedDict()
        lintok, dispatched, touched, disp_proj = set(), set(), set(), set()
        pend = {}
        with open(f, encoding='utf-8', errors='replace') as fh:
            for l in fh:
                try:
                    o = json.loads(l)
                except Exception:
                    continue
                t = o.get('type')
                if t not in ('assistant', 'user'):
                    continue
                if t == 'user':
                    c = o.get('message', {}).get('content')
                    if kind is None:
                        s = c if isinstance(c, str) else json.dumps(c)
                        kind = 'agent' if FIRST.match(s) else 'chef'
                    if isinstance(c, list):
                        for b in c:
                            if isinstance(b, dict) and b.get('type') == 'tool_result' and b.get('tool_use_id') in pend:
                                keys = pend.pop(b['tool_use_id'])
                                x = b.get('content')
                                x = x if isinstance(x, str) else json.dumps(x)
                                if len(keys) == 1:
                                    if 'OK — pack dispatchable' in x:
                                        lintok.add(keys[0])
                                else:
                                    for blk in re.split(r'(?=pack T\d+)', x):
                                        m = re.match(r'pack (T\d+)', blk)
                                        if m and 'OK — pack dispatchable' in blk:
                                            for k in keys:
                                                if k[1] == m.group(1):
                                                    lintok.add(k)
                    continue
                if kind is None:
                    kind = 'chef'
                m = o.get('message', {})
                u = m.get('usage', {}) or {}
                ts = o.get('timestamp', '')
                mid = m.get('id') or o.get('uuid')
                ent = msgs.get(mid)
                if ent is None:
                    ctx = (u.get('input_tokens', 0) or 0) + (u.get('cache_read_input_tokens', 0) or 0) + (u.get('cache_creation_input_tokens', 0) or 0)
                    ent = msgs[mid] = {'ts': ts, 'ctx': ctx, 'lines': []}
                ot = u.get('output_tokens', 0) or 0
                tus = []
                for c in m.get('content', []):
                    if not (isinstance(c, dict) and c.get('type') == 'tool_use'):
                        continue
                    inp = c.get('input', {}) or {}
                    k, sub = cat(c.get('name'), inp)
                    t5 = None
                    cmd = inp.get('command', '') if c.get('name') == 'Bash' else ''
                    if c.get('name') == 'Bash' and kind == 'chef':
                        proj = re.search(r'--projet\s+(\S+)', cmd)
                        proj = proj.group(1) if proj else '*'
                        if 'pack-lint' in cmd:
                            mm = re.search(r'pack-lint\s+((?:T\d+\s*)+)', cmd)
                            if mm:
                                pend[c['id']] = [(proj, x) for x in mm.group(1).split()]
                        if re.search(r'(?:vx\.py|agentx)\s+dispatch', cmd) and '--etat' not in cmd:
                            for x in re.findall(r'\bT\d{3,}\b', cmd):
                                dispatched.add((proj, x))
                            disp_proj.add(proj)
                    if c.get('name') in ('Write', 'Edit', 'MultiEdit') and kind == 'chef':
                        p = inp.get('file_path', '')
                        pm = re.search(r'vault/projets/([^/]+)/', p)
                        proj = pm.group(1) if pm else '?'
                        if p.endswith('context.md'):
                            tm = re.search(r'/taches/(T\d+)-', p)
                            if tm:
                                key = (proj, tm.group(1))
                                has = lambda S: key in S or ('*', key[1]) in S
                                if has(dispatched):
                                    cl = CLASSES[3]
                                elif has(lintok):
                                    cl = CLASSES[2]
                                elif key in touched or c.get('name') != 'Write':
                                    cl = CLASSES[1]
                                else:
                                    cl = CLASSES[0]
                                touched.add(key)
                                t5 = ('pack', cl, key)
                        elif re.search(r'/notes/contrat-[^/]*\.md$', p) or p.endswith('/decisions.md'):
                            typ = 'decisions.md' if p.endswith('decisions.md') else 'contrat-*.md'
                            en = proj in disp_proj or '*' in disp_proj
                            t5 = ('x', typ + (' après dispatch' if en else ' avant dispatch'), None)
                    tus.append((k, sub, t5))
                ent['lines'].append((ot, tus))
        if kind is None:
            continue
        tss = []
        for mid, ent in msgs.items():
            if not ent['ts'] or not en_borne(ent['ts'], depuis, jusqu):
                if not ent['ts']:
                    NS[kind] += 1
                continue
            tss.append((ent['ts'], ent['ctx']))
            CTX[kind].append(ent['ctx'])
            n = sum(len(tus) for _, tus in ent['lines'])
            for ot, tus in ent['lines']:
                OUT[kind] += ot
                if not tus:
                    r = R[kind]['texte/sans outil']
                    r[1] += ot
                    continue
                for k, sub, t5 in tus:
                    sh = ot // len(tus)
                    cx = ent['ctx'] / n
                    r = R[kind][k]
                    r[0] += 1; r[1] += sh; r[2] += cx
                    if sub:
                        s = SUB[sub]
                        s[0] += 1; s[1] += sh; s[2] += cx
                        SUBK[sub] = k
                    if t5:
                        if t5[0] == 'pack':
                            a = T5[t5[1]]
                            a[0] += 1; a[1] += sh; a[2] += cx
                            T5T[t5[2]][t5[1]] += 1
                        else:
                            a = T5X[t5[1]]
                            a[0] += 1; a[1] += sh; a[2] += cx
            if n == 0:
                R[kind]['texte/sans outil'][0] += 1
                R[kind]['texte/sans outil'][2] += ent['ctx']
        if tss:
            tss.sort()
            SESS.append({'session': os.path.basename(f)[:8], 'kind': kind, 'debut': tss[0][0], 'fin': tss[-1][0],
                         'appels': len(tss), 'ctx_cumule': sum(c for _, c in tss), 'pic': max(c for _, c in tss)})
    return R, SUB, SUBK, CTX, OUT, NS, SESS, T5, T5T, T5X


def duree(a, b):
    from datetime import datetime
    p = lambda s: datetime.strptime(s[:19], '%Y-%m-%dT%H:%M:%S')
    sec = int((p(b) - p(a)).total_seconds())
    return f'{sec // 3600}h{(sec % 3600) // 60:02d}'


def dist(v):
    if not v:
        return None
    s = sorted(v)
    return {'n': len(s), 'mediane': int(statistics.median(s)), 'p90': s[int(0.9 * (len(s) - 1))], 'max': s[-1],
            'gt150k': sum(1 for x in s if x > 150000), 'gt200k': sum(1 for x in s if x > 200000)}


def construire(args):
    R, SUB, SUBK, CTX, OUT, NS, SESS, T5, T5T, T5X = analyser(args.dossier, args.depuis, args.jusqu)
    D = {'periode': {'depuis': args.depuis, 'jusqu': args.jusqu}, 'sortie_totale': dict(OUT),
         'sessions': {k: sum(1 for s in SESS if s['kind'] == k) for k in ('chef', 'agent')}, 'messages_sans_timestamp': dict(NS)}
    D['t1'] = {}
    for kind in ('chef', 'agent'):
        T = sum(v[2] for v in R[kind].values()) or 1
        D['t1'][kind] = [{'categorie': k, 'appels': R[kind][k][0], 'sortie': R[kind][k][1], 'ctx': round(R[kind][k][2]),
                          'ctx_moyen': round(R[kind][k][2] / R[kind][k][0]) if R[kind][k][0] else 0,
                          'pct_ctx': round(100 * R[kind][k][2] / T, 1)} for k in CATS if k in R[kind]]
    D['t2'] = {k: dist(CTX[k]) for k in CTX}
    D['t3'] = [{'sous_commande': k, 'type': SUBK[k], 'appels': v[0], 'sortie': v[1], 'ctx': round(v[2]),
                'ctx_moyen': round(v[2] / v[0]) if v[0] else 0} for k, v in sorted(SUB.items(), key=lambda x: (-x[1][2], x[0]))]
    D['t4'] = sorted([dict(s, duree=duree(s['debut'], s['fin'])) for s in SESS if s['kind'] == 'chef'],
                     key=lambda s: (-s['ctx_cumule'], s['session']))[:10]
    D['t5'] = {'pack': [{'classe': c, 'appels': T5[c][0], 'sortie': T5[c][1], 'ctx': round(T5[c][2])} for c in CLASSES if c in T5],
               'contrat_decisions': [{'classe': k, 'appels': v[0], 'sortie': v[1], 'ctx': round(v[2])} for k, v in sorted(T5X.items())],
               'top_tid': [{'projet': k[0], 'tid': k[1], 'ecritures': sum(c.values()), **{x: c.get(x, 0) for x in CLASSES}}
                           for k, c in sorted(T5T.items(), key=lambda x: (-sum(x[1].values()), x[0]))[:10]]}
    return D


def n(x):
    return f'{x:,}'.replace(',', ' ')


def md(D):
    L = []
    p = D['periode']
    L.append(f"périmètre : depuis {p['depuis'] or '∅'} jusqu {p['jusqu'] or '∅'} · sessions {D['sessions']} · sortie {D['sortie_totale']} · sans timestamp {D['messages_sans_timestamp'] or '∅'}")
    L.append('')
    for kind in ('chef', 'agent'):
        L.append(f'## Tableau 1 — {kind} : par catégorie')
        L.append('| catégorie | appels | sortie | contexte relu | ctx moyen/appel | % ctx |')
        L.append('|---|---:|---:|---:|---:|---:|')
        for r in D['t1'][kind]:
            L.append(f"| {r['categorie']} | {n(r['appels'])} | {n(r['sortie'])} | {n(r['ctx'])} | {n(r['ctx_moyen'])} | {r['pct_ctx']} |")
        L.append('')
    L.append('## Tableau 2 — contexte par appel API')
    L.append('| rôle | appels | médiane | p90 | max | >150k | >200k |')
    L.append('|---|---:|---:|---:|---:|---:|---:|')
    for k, d in D['t2'].items():
        if d:
            L.append(f"| {k} | {n(d['n'])} | {n(d['mediane'])} | {n(d['p90'])} | {n(d['max'])} | {n(d['gt150k'])} | {n(d['gt200k'])} |")
    L.append('')
    L.append('## Tableau 3 — par sous-commande vx (chef + agent)')
    L.append('| sous-commande | type | appels | sortie | contexte relu | ctx moyen | sortie+ctx moyen |')
    L.append('|---|---|---:|---:|---:|---:|---:|')
    for r in D['t3']:
        L.append(f"| {r['sous_commande']} | {r['type']} | {n(r['appels'])} | {n(r['sortie'])} | {n(r['ctx'])} | {n(r['ctx_moyen'])} | {n(round(r['ctx_moyen'] + r['sortie'] / max(r['appels'], 1)))} |")
    L.append('')
    L.append('## Tableau 4 — sessions chef : top 10 par contexte cumulé')
    L.append('| session | début (UTC) | durée | appels | ctx cumulé | pic |')
    L.append('|---|---|---|---:|---:|---:|')
    for s in D['t4']:
        L.append(f"| {s['session']} | {s['debut'][:16]} | {s['duree']} | {n(s['appels'])} | {n(s['ctx_cumule'])} | {n(s['pic'])} |")
    L.append('')
    L.append('## Tableau 5 — éditions chef de packs (spec qui bouge = 2 dernières classes)')
    L.append('| classe | appels | sortie | contexte relu |')
    L.append('|---|---:|---:|---:|')
    for r in D['t5']['pack'] + D['t5']['contrat_decisions']:
        L.append(f"| {r['classe']} | {n(r['appels'])} | {n(r['sortie'])} | {n(r['ctx'])} |")
    L.append('')
    L.append('| projet | TID | écritures | ' + ' | '.join(CLASSES) + ' |')
    L.append('|---|---|---:|' + '---:|' * len(CLASSES))
    for r in D['t5']['top_tid']:
        L.append(f"| {r['projet']} | {r['tid']} | {r['ecritures']} | " + ' | '.join(str(r[c]) for c in CLASSES) + ' |')
    return '\n'.join(L)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--depuis')
    ap.add_argument('--jusqu')
    ap.add_argument('--format', choices=['md', 'json'], default='md')
    ap.add_argument('--dossier', default=DEFAUT)
    a = ap.parse_args()
    D = construire(a)
    print(md(D) if a.format == 'md' else json.dumps(D, ensure_ascii=False, indent=1, sort_keys=True))


if __name__ == '__main__':
    main()
