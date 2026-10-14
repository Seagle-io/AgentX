# Fixtures orthoworkspace

Format `--fixture` du banc : `{ "CODE": { items, link?, metadata?, params?, title?, instructions? } }`. 1 fichier = 1 code. Source : `/tmp/banc-t*/fx*`, dédupliqué par contenu.

| Code | Nom | Teste | Tâches |
|---|---|---|---|
| ANAG | 3l | 1 items · link=false · texte max 79 car. | T263 |
| ANAG | doublon | 2 items · link=false | T165 |
| ANAG | lie | 2 items · link=false | T165 |
| ANAG | long | 5 items · link=false · texte max 67 car. · params {"indice": true, "accents": "respecter", "casse": "majuscules"} | T165 |
| ANAG | long-t263 | 3 items · link=false · texte max 49 car. | T263 |
| ANAG | mal-forme | 9 items · link=false · 3 mal formés | T165 |
| ANAG | mal-forme-t263 | 8 items · link=false · 3 mal formés | T263 |
| ANAG | noid | 2 items · link=false · 1 mal formés | T263 |
| ANAG | nolink | 1 items · link=false | T263 |
| ANAG | nul | 2 items · link=false · 1 mal formés | T165 |
| ANAG | sansid | 2 items · link=false · 1 mal formés | T165 |
| ANAG | trente | 30 items · link=false | T165 |
| ANAG | trente-t263 | 30 items · link=false | T263 |
| ANAG | un | 1 items · link=false | T165 |
| ANAG | un-t263 | 1 items | T263 |
| ANAG | vide | 0 items · link=false | T165 |
| ANAG | vide-t263 | 0 items | T263 |
| APPAR | long | 33 items · link=false · 2 mal formés · titre 112 car. | T191 |
| APPAR | long-t194 | 4 items · link=false | T194 |
| APPAR | mal-forme | 11 items · link=false · 3 mal formés | T194 |
| APPAR | titre2 | 3 items · titre 112 car. | T191 |
| APPAR | trente | 30 items · link=false | T194 |
| APPAR | un | 1 items · link=false | T194 |
| APPAR | vide | 2 items · link=false · 1 mal formés | T191 |
| APPAR | vide-t194 | 0 items · link=false | T194 |
| BARRAGE | grand | 1 items · link=false · params {"rows": 12, "cols": 14} | T196 |
| BARRAGE | lie | 1 items · link=false | T196 |
| BARRAGE | lie-t278 | 1 items | T278 |
| BARRAGE | long | 1 items · link=false · params {"rows": 12, "cols": 14} · titre 134 car. | T196 |
| BARRAGE | long-t278 | 1 items · link=false | T278 |
| BARRAGE | mal-forme | 6 items · link=false · 4 mal formés · params {"rows": -3, "cols": 1000000000.0, "targetPercent": "abc"} | T196 |
| BARRAGE | mal-forme-t278 | 5 items · link=false · 2 mal formés | T278 |
| BARRAGE | mixte | 1 items · link=false | T278 |
| BARRAGE | nul | 0 items · link=false | T196 |
| BARRAGE | params | 1 items · link=false · params {"rows": 1000, "cols": 1000, "targetPercent": -5} | T278 |
| BARRAGE | prefixe | 1 items · link=false | T196 |
| BARRAGE | trente | 30 items · link=false · params {"rows": 12, "cols": 14} | T196 |
| BARRAGE | trente-t278 | 30 items · link=false | T278 |
| BARRAGE | un | 1 items · link=false | T196 |
| BARRAGE | un-t278 | 1 items · link=false | T278 |
| BARRAGE | vide | 0 items · link=false | T196, T278 |
| CARTCOT | long | 3 items · texte max 51 car. · titre 99 car. | T242 |
| CARTCOT | vide | 4 items · link=false · 1 mal formés | T242 |
| CARTSEM | 3l | 1 items · link=false · texte max 25 car. | T263 |
| CARTSEM | linked | 1 items | T222 |
| CARTSEM | long | 5 items · link=false · 1 mal formés · titre 112 car. | T191 |
| CARTSEM | long-t194 | 2 items · link=false · texte max 25 car. | T194 |
| CARTSEM | long-t222 | 2 items · link=false · texte max 25 car. | T222 |
| CARTSEM | long-t263 | 1 items · link=false · texte max 25 car. | T263 |
| CARTSEM | mal-forme | 6 items · link=false · 2 mal formés | T194 |
| CARTSEM | mal-forme-t222 | 4 items · link=false · 1 mal formés | T222 |
| CARTSEM | mal-forme-t222-2 | 5 items · link=false · 1 mal formés | T222, T263 |
| CARTSEM | nolink | 1 items · link=false | T263 |
| CARTSEM | ovf | 1 items · link=false | T222 |
| CARTSEM | real | 3 items · link=false | T222 |
| CARTSEM | titre2 | 2 items · titre 112 car. | T191 |
| CARTSEM | trente | 30 items · link=false | T194 |
| CARTSEM | trente-t222 | 30 items · link=false | T222 |
| CARTSEM | trente-t222-2 | 30 items · link=false | T222 |
| CARTSEM | trente-t263 | 30 items · link=false | T263 |
| CARTSEM | un | 1 items · link=false | T194 |
| CARTSEM | un-t222 | 1 items · link=false | T222 |
| CARTSEM | un-t222-2 | 1 items · link=false | T222 |
| CARTSEM | un-t263 | 1 items | T263 |
| CARTSEM | vide | 1 items · link=false | T191 |
| CARTSEM | vide-t194 | 0 items · link=false | T194, T222 |
| CARTSEM | vide-t263 | 0 items | T263 |
| CPTSYL | bords | 5 items · link=false · texte max 63 car. | T178 |
| CPTSYL | phon | 3 items · link=false · params {"unite": "phonemes"} | T178 |
| CPTSYL | t186-fx | 5 items · link=false · texte max 25 car. · params {"unite": "phonemes"} | T186 |
| CPTSYL | trente | 30 items · link=false | T178 |
| CPTSYL | trentecmp | 30 items · link=false · params {"tache": "comparer", "sens": "long"} | T178 |
| CPTSYL | un | 1 items · link=false | T178 |
| CPTSYL | vide | 0 items · link=false | T178 |
| CQT | un | 1 items · metadata {"representation": null} · params {"rounds": "abc", "quantityMin": -4, "quantityMax": 1000000000.0, "rep · titre 166 car. | T169 |
| CQT | vide | 0 items · params {"rounds": 50, "quantityMin": 0, "quantityMax": 30, "representation":  | T169 |
| CQT | vide-t169 | 0 items · params {"rounds": 1, "quantityMin": 5, "quantityMax": 5, "comparisonType": "o | T169 |
| CQT | vide-t169-2 | 0 items · params {"rounds": 20, "quantityMin": 25, "quantityMax": 30, "representation": | T169 |
| CQT | vide-t173 | 0 items · titre 18 car. · consigne 21 car. | T173 |
| DBLQ | params | 0 items · params {"rounds": 50, "rowsCount": 6, "leftRepresentation": "images", "rightR | T278 |
| DBLQ | un | 1 items · 1 mal formés · params {"rounds": -1, "rowsCount": "6", "quantityMin": "x", "quantityMax": 99 · titre 166 car. | T169 |
| DBLQ | vide | 0 items · params {"rounds": 50, "rowsCount": 6, "quantityMin": 0, "quantityMax": 20, "l | T169 |
| DBLQ | vide-t169 | 0 items · params {"rounds": 1, "quantityMin": 0, "quantityMax": 2, "rowsCount": 6, "lef | T169 |
| DBLQ | vide-t169-2 | 0 items · params {"rounds": 20, "rowsCount": 6, "quantityMin": 9, "quantityMax": 20, "l | T169 |
| DBLQ | vide-t269 | 0 items | T269 |
| DEVIND | devbad2 | 2 items · link=false | T214 |
| DEVIND | dimg | 1 items · params {"cartes": "image"} | T218 |
| DEVIND | doral | 1 items · params {"mode": "oral"} | T218 |
| DEVIND | long | 30 items · link=false · texte max 27 car. · titre 128 car. | T214 |
| DEVIND | mal-forme | 2 items · link=false | T214 |
| DEVIND | mal-forme-t218 | 9 items · link=false · 2 mal formés | T218 |
| DEVIND | nul | 5 items · link=false · 4 mal formés | T214 |
| DEVIND | trente | 30 items · link=false | T218 |
| DEVIND | un | 1 items · link=false | T214 |
| DEVIND | un-t218 | 1 items | T218 |
| DEVIND | vide | 0 items · link=false | T218 |
| DIALBD | long | 1 items · link=false · texte max 1599 car. | T168 |
| DIALBD | mix | 5 items · link=false · 1 mal formés | T168 |
| DIALBD | mix2 | 4 items · link=false | T168 |
| DIALBD | nuld | 2 items · link=false · 1 mal formés | T168 |
| DIALBD | trente | 30 items · link=false | T168 |
| DIALBD | trente-t167 | 30 items · link=false | T167 |
| DIALBD | un | 1 items · link=false · texte max 600 car. | T167 |
| DIALBD | un-t167 | 1 items · link=false | T167 |
| DIALBD | vide | 0 items · link=false | T167 |
| DISV | l | 30 items · titre 128 car. | T171 |
| DISV | long | 2 items · link=false · texte max 78 car. | T202 |
| DISV | mal-forme | 8 items · link=false · 3 mal formés | T202 |
| DISV | n | 3 items · 1 mal formés | T171 |
| DISV | r | 30 items | T171 |
| DISV | r2 | 30 items · titre 65 car. | T171 |
| DISV | t | 3 items · link=false | T171 |
| DISV | t162-c | 2 items | T162 |
| DISV | t162-e | 3 items · 2 mal formés | T162 |
| DISV | trente | 30 items | T162, T171 |
| DISV | trente-t162 | 30 items | T162 |
| DISV | trente-t202 | 30 items | T202 |
| DISV | un | 1 items | T171 |
| DISV | un-t202 | 1 items | T202 |
| DISV | vide | 0 items | T162, T202 |
| DISV | vide-t171 | 1 items | T171 |
| DISV | w | 4 items · link=false · texte max 25 car. | T171 |
| DISV | wrap | 4 items · link=false · texte max 111 car. | T202 |
| ESCPHON | long | 2 items · titre 99 car. | T242 |
| ESCPHON | vide | 3 items · link=false · 1 mal formés | T242 |
| FLEXPH | lim | 8 items · link=false · 2 mal formés · texte max 430 car. | T182 |
| FLEXPH | real | 2 items · link=false · texte max 91 car. | T182 |
| FLEXPH | set | 1 items · link=false | T182 |
| FLEXPH | trente | 30 items · link=false · texte max 105 car. | T182 |
| FLEXPH | un | 1 items · link=false · texte max 29 car. | T182 |
| FLEXPH | vide | 0 items · link=false | T182 |
| FLUCHR | long | 2 items · texte max 26 car. · titre 99 car. | T242 |
| FLUCHR | vide | 3 items · link=false · 1 mal formés | T242 |
| LOCPHON | bords | 4 items · link=false · texte max 63 car. · params {"choix": "debutMilieuFin"} | T178 |
| LOCPHON | trente | 30 items · link=false | T178 |
| LOCPHON | trentecmp | 30 items · link=false · params {"choix": "debutMilieuFin"} | T178 |
| LOCPHON | un | 1 items · link=false | T178 |
| LOCPHON | vide | 0 items · link=false | T178 |
| MANIPH | bords | 6 items · link=false · 1 mal formés · texte max 64 car. | T178, T186 |
| MANIPH | lies | 2 items · link=false | T186 |
| MANIPH | trente | 30 items · link=false | T178 |
| MANIPH | un | 1 items · link=false | T178 |
| MANIPH | vide | 0 items · link=false | T178 |
| MEMQ | vide | 0 items · params {"rounds": 50, "quantityMin": 0, "quantityMax": 30, "optionsCount": 6, | T169 |
| MEMQ | vide-t169 | 0 items · params {"rounds": 1, "quantityMin": 0, "quantityMax": 0, "representation": "c | T169 |
| MEMQ | vide-t169-2 | 0 items · params {"rounds": 1000000.0, "quantityMin": 30, "quantityMax": 2, "optionsCou · titre 166 car. | T169 |
| MEMQ | vide-t169-2-3 | 0 items · params {"rounds": 20, "quantityMin": 20, "quantityMax": 30, "optionsCount": 6 | T169 |
| MOTCACH | lie | 2 items · link=false | T196 |
| MOTCACH | long | 4 items · link=false · texte max 25 car. · params {"taille": 6} · titre 134 car. | T196 |
| MOTCACH | mal-forme | 9 items · link=false · 3 mal formés · params {"taille": "grand"} | T196 |
| MOTCACH | nul | 0 items · link=false | T196 |
| MOTCACH | trente | 30 items · link=false · params {"taille": 16} | T196 |
| MOTCACH | un | 1 items · link=false | T196 |
| MOTCACH | vide | 0 items · link=false | T196 |
| MOTDIF | courts | 2 items · link=false | T163 |
| MOTDIF | dupe | 4 items | T155 |
| MOTDIF | invisible | 6 items · link=false · params {"alteration": "insertion"} | T163 |
| MOTDIF | long | 4 items · texte max 46 car. | T155 |
| MOTDIF | long-t160 | 4 items · link=false · texte max 46 car. | T160 |
| MOTDIF | long-t163 | 3 items · link=false · texte max 86 car. | T163 |
| MOTDIF | mal-forme | 4 items · 1 mal formés | T155 |
| MOTDIF | mal-forme-t163 | 8 items · link=false · 2 mal formés | T163 |
| MOTDIF | nul | 2 items · link=false · 1 mal formés | T163 |
| MOTDIF | null3 | 0 items · link=false | T196, T211 |
| MOTDIF | omis | 30 items · params {"alteration": "omission", "partPareilles": 10} | T155 |
| MOTDIF | sansimage | 2 items · link=false | T163 |
| MOTDIF | short | 2 items | T155 |
| MOTDIF | space | 2 items | T155 |
| MOTDIF | space-t160 | 3 items · link=false · params {"alteration": "insertion", "partPareilles": 10} | T160 |
| MOTDIF | trente | 30 items | T155 |
| MOTDIF | trente-t163 | 30 items · link=false | T163 |
| MOTDIF | un | 1 items | T155 |
| MOTDIF | un-t163 | 1 items · link=false | T163 |
| MOTDIF | vide | 0 items | T155 |
| MOTDIF | vide-t163 | 0 items · link=false | T163 |
| ORDM | linked | 1 items | T222 |
| ORDM | long | 2 items · link=false | T222 |
| ORDM | long-t263 | 1 items · link=false | T263 |
| ORDM | mal-forme | 5 items · link=false · 1 mal formés | T222 |
| ORDM | mal-forme-t222 | 6 items · link=false · 2 mal formés | T222, T263 |
| ORDM | nolink | 1 items · link=false | T263 |
| ORDM | trente | 30 items · link=false | T222 |
| ORDM | trente-t222 | 30 items · link=false | T222 |
| ORDM | trente-t263 | 30 items · link=false | T263 |
| ORDM | un | 1 items · link=false | T222 |
| ORDM | un-t222 | 1 items · link=false | T222 |
| ORDM | un-t263 | 1 items | T263 |
| ORDM | vide | 0 items · link=false | T222 |
| ORDM | vide-t263 | 0 items | T263 |
| PAIRSIMI | long | 1 items | T269 |
| PAIRSIMI | mal-forme | 4 items · 2 mal formés | T269 |
| PAIRSIMI | pairs-intrus7 | 1 items | T269 |
| PAIRSIMI | trente | 30 items | T269 |
| PAIRSIMI | un | 1 items | T269 |
| PAIRSIMI | vide | 0 items | T269 |
| PENDU | doublon | 2 items · link=false | T165 |
| PENDU | lie | 2 items · link=false | T165 |
| PENDU | long | 5 items · link=false · texte max 67 car. · params {"indice": true, "accents": "respecter", "casse": "majuscules"} | T165 |
| PENDU | mal-forme | 9 items · link=false · 3 mal formés | T165 |
| PENDU | nul | 2 items · link=false · 1 mal formés | T165 |
| PENDU | sansid | 2 items · link=false · 1 mal formés | T165 |
| PENDU | trente | 30 items · link=false | T165 |
| PENDU | un | 1 items · link=false | T165 |
| PENDU | vide | 0 items · link=false | T165 |
| PHRIMG | long | 1 items · link=false · texte max 1599 car. | T168 |
| PHRIMG | mix | 4 items · link=false · 1 mal formés · texte max 26 car. | T168 |
| PHRIMG | mix2 | 3 items · link=false · texte max 26 car. | T168 |
| PHRIMG | nulp | 2 items · link=false · 1 mal formés | T168 |
| PHRIMG | t167-b | 2 items · link=false · texte max 600 car. | T167 |
| PHRIMG | trente | 30 items · link=false | T168 |
| PHRIMG | trente-t167 | 30 items · link=false | T167 |
| PHRIMG | un | 1 items | T167 |
| PHRIMG | vide | 0 items · link=false | T167 |
| PHRPICT | badph | 2 items · link=false | T222 |
| PHRPICT | badph2 | 1 items · link=false | T222 |
| PHRPICT | lim | 8 items · link=false · 2 mal formés | T182 |
| PHRPICT | linked | 1 items | T222 |
| PHRPICT | long | 1 items · link=false | T222 |
| PHRPICT | long-t263 | 1 items · link=false | T263 |
| PHRPICT | mal-forme | 3 items · link=false · 1 mal formés | T222 |
| PHRPICT | mal-forme-t222 | 5 items · link=false · 1 mal formés | T222, T263 |
| PHRPICT | media | 1 items · link=false | T185 |
| PHRPICT | nolink | 1 items · link=false | T263 |
| PHRPICT | real | 2 items · link=false | T182 |
| PHRPICT | set | 1 items · link=false · params {"showLabel": false} | T182 |
| PHRPICT | t183-fx | 2 items | T183 |
| PHRPICT | trente | 30 items · link=false | T182 |
| PHRPICT | trente-t222 | 30 items · link=false | T222 |
| PHRPICT | trente-t222-2 | 30 items · link=false | T222 |
| PHRPICT | trente-t263 | 30 items · link=false | T263 |
| PHRPICT | un | 1 items · link=false | T182 |
| PHRPICT | un-t222 | 1 items · link=false | T222 |
| PHRPICT | un-t222-2 | 1 items · link=false | T222 |
| PHRPICT | un-t263 | 1 items | T263 |
| PHRPICT | vide | 0 items · link=false | T182, T222 |
| PHRPICT | vide-t263 | 0 items | T263 |
| PONCTU | lim | 10 items · link=false · 2 mal formés · texte max 312 car. · image | T182 |
| PONCTU | set | 3 items · link=false · params {"choix": "deux"} | T182 |
| PONCTU | t183-fx | 3 items · image | T183 |
| PONCTU | trente | 30 items · link=false · texte max 54 car. | T182 |
| PONCTU | un | 1 items · link=false | T182 |
| PONCTU | vide | 0 items · link=false | T182 |
| QCM | long | 1 items · link=false · texte max 1599 car. | T168 |
| QCM | mix | 5 items · link=false · 2 mal formés | T168 |
| QCM | mix2 | 4 items · link=false · 1 mal formés | T168 |
| QCM | nul | 2 items · link=false · 1 mal formés | T168 |
| QCM | trente | 30 items · link=false | T168 |
| QCM | trente-t167 | 30 items · link=false | T167 |
| QCM | un | 1 items · link=false · texte max 600 car. | T167 |
| QCM | un-t167 | 1 items · link=false | T167 |
| QCM | vide | 0 items · link=false | T167 |
| RELIER | img15 | 3 items | T202 |
| RELIER | img30 | 1 items | T202 |
| RELIER | img34 | 1 items | T221 |
| RELIER | long | 5 items · link=false · 1 mal formés · titre 112 car. | T191 |
| RELIER | long-t194 | 1 items · link=false | T194 |
| RELIER | long-t202 | 1 items · link=false | T202 |
| RELIER | long-t221 | 1 items · link=false | T221 |
| RELIER | mal-forme | 5 items · link=false · 1 mal formés | T194 |
| RELIER | mal-forme-t202 | 5 items · link=false · 2 mal formés | T202 |
| RELIER | mal-forme-t221 | 6 items · link=false · 3 mal formés | T221 |
| RELIER | rond60 | 1 items · link=false | T221 |
| RELIER | run-rpic | 2 items | T194 |
| RELIER | run-rpreset | 2 items · link=false | T194 |
| RELIER | titre2 | 3 items · titre 112 car. | T191 |
| RELIER | trente | 2 items · link=false | T194 |
| RELIER | trente-t202 | 30 items · link=false | T202 |
| RELIER | trente-t221 | 1 items · link=false | T221 |
| RELIER | trente-t221-2 | 30 items · link=false | T221 |
| RELIER | un | 1 items · link=false | T194 |
| RELIER | un-t202 | 2 items · link=false | T202 |
| RELIER | un-t221 | 1 items | T221 |
| RELIER | vide | 1 items · link=false | T191 |
| RELIER | vide-t194 | 0 items · link=false | T194 |
| RELIER | vide-t202 | 0 items | T202, T221 |
| REPN | l | 0 items · params {"count": 30, "size": "grande"} · titre 128 car. | T171 |
| REPN | long | 0 items · params {"count": 30, "size": "tres-petite"} · consigne 2015 car. | T202 |
| REPN | mal-forme | 0 items · params {"count": "abc", "size": "enorme"} | T202 |
| REPN | r2 | 0 items · params {"count": 20} · titre 65 car. | T171 |
| REPN | r30titre | 0 items · params {"count": 30, "size": "tres-petite"} · titre 720 car. | T221 |
| REPN | r30v | 0 items · params {"count": 30, "size": "variable"} | T221 |
| REPN | rbig | 0 items · params {"count": 1000000000.0, "size": "grande"} | T221 |
| REPN | repnt20 | 0 items · params {"count": 30, "size": "tres-petite"} · titre 1259 car. | T202 |
| REPN | repnt20c10 | 0 items · params {"count": 10, "size": "moyenne"} · titre 1259 car. | T202 |
| REPN | repnt24 | 0 items · params {"count": 30, "size": "tres-petite"} · titre 1511 car. | T202 |
| REPN | repntitre | 0 items · params {"count": 30, "size": "tres-petite"} · titre 2834 car. | T202 |
| REPN | rneg | 0 items · params {"count": -5} | T221 |
| REPN | un | 0 items · params {"count": 3, "size": "tres-petite"} | T171 |
| REPN | un-t202 | 0 items · params {"count": 3, "size": "grande"} | T202 |
| REPN | vide | 0 items · params {"count": 30, "size": "grande"} | T162 |
| REPN | vide-t162 | 0 items · params {"count": 30, "size": "tres-petite"} | T162 |
| REPN | vide-t221 | 0 items · params {"count": 0, "size": "x"} | T221 |
| SAISIE | long | 30 items · link=false · texte max 240 car. | T214 |
| SAISIE | mal-forme | 14 items · link=false · 3 mal formés | T218 |
| SAISIE | saiimg | 1 items · link=false · texte max 25 car. | T214 |
| SAISIE | saims | 2 items · link=false · 1 mal formés | T214 |
| SAISIE | sok | 2 items | T218 |
| SAISIE | sok2 | 2 items · link=false | T218 |
| SAISIE | trente | 30 items · link=false · texte max 370 car. | T218 |
| SAISIE | un | 1 items · link=false | T218 |
| SAISIE | vide | 0 items · link=false | T218 |
| SEGLEX | l | 1 items · titre 128 car. | T171 |
| SEGLEX | n | 2 items · 1 mal formés | T171 |
| SEGLEX | t | 3 items | T171 |
| SEGLEX | t1 | 2 items | T171 |
| SEGLEX | t2 | 2 items | T171 |
| SEGLEX | t3 | 1 items | T171 |
| SEGLEX | trente | 30 items | T162 |
| SEGLEX | trente-t171 | 30 items | T171 |
| SEGLEX | un | 1 items | T162 |
| SEGLEX | un-t171 | 1 items | T171 |
| SEGLEX | vide | 0 items | T171 |
| SEGLEX | w | 2 items | T171 |
| SERISIMI | l | 1 items · titre 128 car. | T171 |
| SERISIMI | n | 2 items · 1 mal formés | T171 |
| SERISIMI | t | 2 items | T171 |
| SERISIMI | t162-a | 2 items · 1 mal formés | T162 |
| SERISIMI | trente | 30 items | T171 |
| SERISIMI | un | 1 items | T171 |
| SERISIMI | vide | 0 items | T171 |
| SERISIMI | w | 1 items | T171 |
| STROOP | lie | 0 items · link=false · params {"consigne": "mot"} | T196 |
| STROOP | long | 0 items · link=false · params {"support": "objets", "trials": 40} · titre 134 car. | T196 |
| STROOP | mal-forme | 1 items · link=false · 1 mal formés · params {"trials": -5, "support": "x", "consigne": null, "incongruentPercent": | T196 |
| STROOP | nul | 0 items · link=false | T196 |
| STROOP | params | 0 items · params {"support": "objets"} | T278 |
| STROOP | trente | 0 items · link=false · params {"trials": 100, "incongruentPercent": 75} | T196 |
| STROOP | un | 0 items · link=false · params {"trials": 4, "incongruentPercent": 100} | T196 |
| STROOP | vide | 0 items · link=false | T196 |
| STROOP | vide-t269 | 0 items | T269 |
| THERMEMO | 200 | 4 items · link=false · texte max 193 car. | T211 |
| THERMEMO | 200img | 4 items · link=false · texte max 193 car. · image · titre 78 car. | T211 |
| THERMEMO | emotion | 3 items · link=false · texte max 40 car. · metadata {"steps": "emotion"} | T211 |
| THERMEMO | long | 4 items · link=false · texte max 660 car. · image | T211 |
| THERMEMO | long-t227 | 3 items · link=false · texte max 3321 car. | T227 |
| THERMEMO | mal-forme | 11 items · link=false · 5 mal formés | T211 |
| THERMEMO | mal-forme-t227 | 8 items · link=false · 3 mal formés | T227 |
| THERMEMO | malseul | 1 items · link=false | T211 |
| THERMEMO | moyen | 4 items · link=false · texte max 136 car. · image | T211 |
| THERMEMO | moyen2 | 4 items · link=false · texte max 136 car. | T211 |
| THERMEMO | nul | 0 items · link=false | T211 |
| THERMEMO | thallbad | 2 items · link=false · 1 mal formés | T227 |
| THERMEMO | thermo | 3 items · link=false · texte max 40 car. · metadata {"steps": "thermometre"} | T211 |
| THERMEMO | thimg | 2 items · link=false · image | T227 |
| THERMEMO | thmid11 | 1 items · link=false · texte max 1078 car. | T227 |
| THERMEMO | thmid14 | 1 items · link=false · texte max 1372 car. | T227 |
| THERMEMO | thmid17 | 1 items · link=false · texte max 1666 car. | T227 |
| THERMEMO | thmid20 | 1 items · link=false · texte max 1960 car. | T227 |
| THERMEMO | thmid9 | 1 items · link=false · texte max 882 car. | T227 |
| THERMEMO | thstemo | 3 items · link=false · texte max 42 car. · params {"steps": "emotion"} | T227 |
| THERMEMO | thstep | 3 items · link=false · texte max 44 car. · params {"steps": "thermometre"} | T227 |
| THERMEMO | thstepe | 3 items · link=false · texte max 44 car. · params {"steps": "emotion"} | T227 |
| THERMEMO | thstthermo | 3 items · link=false · texte max 42 car. · params {"steps": "thermometre"} | T227 |
| THERMEMO | trente | 30 items · link=false · texte max 41 car. · titre 100 car. | T211 |
| THERMEMO | trente-t227 | 30 items · link=false · texte max 45 car. | T227 |
| THERMEMO | un | 1 items · link=false · texte max 40 car. | T211 |
| THERMEMO | un-t227 | 1 items · link=false · texte max 44 car. | T227 |
| THERMEMO | vide | 0 items · link=false | T211, T227 |
| TRACL | long | 5 items · link=false | T211 |
| TRACL | mal-forme | 11 items · link=false · 5 mal formés | T211 |
| TRACL | mal-forme-t227 | 7 items · link=false · 1 mal formés | T227 |
| TRACL | malseul | 3 items · link=false | T211 |
| TRACL | nul | 0 items · link=false | T211 |
| TRACL | tr0leg | 0 items · link=false · metadata {"letters": ["a", "b"]} | T227 |
| TRACL | tracl | 5 items · link=false | T226 |
| TRACL | tracmeta | 0 items · link=false · metadata {"letters": ["ab", "", null, "😀", "x"]} | T211 |
| TRACL | trallbad | 3 items · link=false · 2 mal formés | T227 |
| TRACL | trdup | 2 items · link=false | T227 |
| TRACL | trente | 30 items · link=false · titre 100 car. | T211 |
| TRACL | trente-t227 | 30 items · link=false | T227 |
| TRACL | truni | 6 items · link=false | T227 |
| TRACL | un | 1 items · link=false | T211 |
| TRACL | un-t227 | 1 items · link=false | T227 |
| TRACL | vide | 0 items · link=false | T211, T227 |
| ZONIMG | fail | 2 items · link=false · image | T237 |
| ZONIMG | lie | 1 items · texte max 21 car. · image | T278 |
| ZONIMG | long | 2 items · texte max 691 car. · image | T269 |
| ZONIMG | long-t278 | 1 items · texte max 621 car. · image | T278 |
| ZONIMG | mal-forme | 2 items · link=false · image | T214 |
| ZONIMG | mal-forme-t218 | 9 items · 2 mal formés · image | T218 |
| ZONIMG | mal-forme-t269 | 6 items · 2 mal formés · image | T269 |
| ZONIMG | mal-forme-t278 | 4 items · link=false · 3 mal formés · image | T278 |
| ZONIMG | sansimg | 2 items · link=false · image | T269 |
| ZONIMG | trente | 30 items · texte max 376 car. · image | T218 |
| ZONIMG | trente-t269 | 30 items · image | T269 |
| ZONIMG | trente-t278 | 30 items · texte max 21 car. · image | T278 |
| ZONIMG | un | 1 items · image | T218 |
| ZONIMG | un-t269 | 1 items · image | T269 |
| ZONIMG | un-t278 | 1 items · texte max 21 car. · image | T278 |
| ZONIMG | vide | 0 items · link=false | T218, T278 |
| ZONIMG | vide-t269 | 0 items | T269 |
| ZONIMG | znoid | 2 items · 2 mal formés · image | T218 |
| ZONIMG | zonbigprompt | 1 items · link=false · texte max 1200 car. · image · titre 120 car. | T214 |
| ZONIMG | zonnoimg | 1 items · link=false · image | T214 |
| ZONIMG | zonover | 2 items · link=false · texte max 800 car. · image | T214 |
