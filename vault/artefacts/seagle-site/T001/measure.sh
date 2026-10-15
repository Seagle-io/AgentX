#!/bin/sh
# estimation: esbuild minify, bundle isolé via stdin (lecture seule du dépôt, sortie /dev/stdout)
cd /home/jdrac/Documents/Workspace/seagle-website
m(){ n=$1; code=$2
 out=$(printf '%s' "$code" | NODE_PATH=/home/jdrac/Documents/Workspace/seagle-website/node_modules node_modules/.bin/esbuild --bundle --minify --charset=utf8 --format=esm --platform=browser --jsx=automatic --alias:@=/home/jdrac/Documents/Workspace/seagle-website/src --define:process.env.NODE_ENV='"production"' --loader:.png=dataurl --loader:.webp=dataurl --loader:.jpg=dataurl --loader:.svg=dataurl --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --loader:.md=empty --loader:.mp4=empty --loader:.webm=empty --loader:.txt=empty --loader:.ts=ts --loader:.tsx=tsx --log-level=error 2>&1 | cat)
 echo "$n $(printf '%s' "$out" | wc -c) $(printf '%s' "$out" | gzip -c | wc -c)"; }
m react-dom-client 'import {createRoot} from "react-dom/client";console.log(createRoot)'
m react 'import * as R from "react";console.log(R)'
m react-router 'import {BrowserRouter,Routes,Route,Link,Navigate,useLocation} from "react-router";console.log(BrowserRouter,Routes,Route,Link,Navigate,useLocation)'
m i18next+react-i18next 'import i from "i18next";import {initReactI18next,useTranslation} from "react-i18next";console.log(i,initReactI18next,useTranslation)'
m motion-react 'import {MotionConfig,motion,AnimatePresence,useInView,useScroll,useTransform} from "motion/react";console.log(MotionConfig,motion,AnimatePresence,useInView,useScroll,useTransform)'
m lenis 'import L from "lenis";console.log(L)'
for l in fr en es de it; do m loc-$l "import x from \"/home/jdrac/Documents/Workspace/seagle-website/src/lib/local/$l\";console.log(x)"; done
m loc-all 'import a from "/home/jdrac/Documents/Workspace/seagle-website/src/lib/local/fr";import b from "/home/jdrac/Documents/Workspace/seagle-website/src/lib/local/en";import c from "/home/jdrac/Documents/Workspace/seagle-website/src/lib/local/es";import d from "/home/jdrac/Documents/Workspace/seagle-website/src/lib/local/de";import e from "/home/jdrac/Documents/Workspace/seagle-website/src/lib/local/it";console.log(a,b,c,d,e)'
m layout 'import L from "/home/jdrac/Documents/Workspace/seagle-website/src/components/Header/layout";console.log(L)'
m layout-nolibs-header 'import L from "/home/jdrac/Documents/Workspace/seagle-website/src/components/Header/header";console.log(L)'
m footer 'import L from "/home/jdrac/Documents/Workspace/seagle-website/src/components/Header/footer";console.log(L)'
m asciicurtain 'import L from "/home/jdrac/Documents/Workspace/seagle-website/src/components/kit/AsciiCurtain";console.log(L)'
m megamenu 'import L from "/home/jdrac/Documents/Workspace/seagle-website/src/components/ui/mega-menu";console.log(L)'
m togglelang 'import L from "/home/jdrac/Documents/Workspace/seagle-website/src/components/ToogleLanguage";console.log(L)'
m themectx 'import * as L from "/home/jdrac/Documents/Workspace/seagle-website/src/contexts/ThemeContext";console.log(L)'
m routes-lib 'import * as L from "/home/jdrac/Documents/Workspace/seagle-website/src/lib/routes";console.log(L)'
m hooks 'import * as a from "/home/jdrac/Documents/Workspace/seagle-website/src/hooks/useLanguageRedirect";import * as b from "/home/jdrac/Documents/Workspace/seagle-website/src/hooks/useHreflang";console.log(a,b)'
m fonts-css 'console.log(1)'
m chatbot 'import L from "/home/jdrac/Documents/Workspace/seagle-website/src/components/ChatBot";console.log(L)'
m react-markdown 'import R from "react-markdown";console.log(R)'
m remixicon 'import {RiChat3Line,RiCloseLine,RiSendPlaneFill} from "@remixicon/react";console.log(RiChat3Line,RiCloseLine,RiSendPlaneFill)'
