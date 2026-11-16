# Harnay : verdict, positionnement et plan 30 jours

Document de travail du fondateur. Les textes destinés au public sont en anglais, parce que le marché l'est.

## 1. Verdict

**Faisable en moins de 30 jours : oui.** Le produit est dans ce dépôt et fonctionne de bout en bout. Il reste environ une journée pour le mettre en ligne (voir « Go live » dans le README).

**Peut-il gagner un concours au MRR à 30 jours : possible, pas probable sans distribution.** Le produit n'est plus le risque. Le risque est d'amener assez de monde sur harnay.dev en trois semaines.

### Ce que disent les chiffres du marché

Relevés le 16 novembre 2026, tous auto-déclarés ou de seconde main, à prendre comme ordres de grandeur :

| Comparable | Modèle | Chiffre |
| --- | --- | --- |
| Kitstarter (kit Claude Code et Codex, lancé en août 2026) | abonnement | 500 $ de MRR ([PeerPush](https://peerpush.com/p/kitstarter)) |
| ClaudeFast (packs de kits) | achat unique | 2 800 $ sur 30 jours, MRR affiché à 0 $ ([TrustMRR](https://trustmrr.com/founder/AbdoMobayad)) |
| ClockedCode | 39 $ en une fois | pas de MRR ([TrustMRR](https://trustmrr.com/startup/clockedcode)) |
| Produits « pour codeurs IA » | tous | cohorte la plus faible, 0,8 % atteignent 10 000 $ par mois ([BigIdeasDB](https://bigideasdb.com/how-to-make-money-with-claude-code)) |

Deux leçons. La catégorie vend surtout en achat unique, ce qui compte pour zéro dans ton concours : Harnay est donc un abonnement dès le premier jour. Et le plafond réaliste d'un produit de ce type sans audience est bas.

En face, le gratuit est massif : Everything Claude Code, claude-code-templates, harness-maker, harnessforge, Claude Harness Generator. Et Claude Code intègre de plus en plus de protections (suppression de chemins critiques, sandbox, mode auto).

### Fourchette honnête à J30

| Scénario | Condition | MRR |
| --- | --- | --- |
| Sans audience, lancement correct | 2 000 à 4 000 visiteurs | 300 à 800 $ |
| Un contenu qui prend (HN, X, un YouTubeur) | 8 000 à 15 000 visiteurs | 1 500 à 3 000 $ |
| Le même, plus 5 équipes signées en direct | démarchage quotidien | 2 000 à 3 500 $ |

Ce sont des estimations, pas des mesures. Hypothèses : 1 % des visiteurs qualifiés paient 19 $, et une agence sur 60 contactées prend le plan Team.

### La question qui décide tout

**As-tu déjà une audience, ou un accès à celle de quelqu'un d'autre ?** Un compte X de builders, une communauté, un YouTubeur qui te répond. Si oui, lance Harnay tel quel. Si non, prévois que la moitié de ton temps parte en démarchage direct des équipes (section 5), parce que 5 équipes à 79 $ valent 21 abonnés Pro et se signent en conversation, sans dépendre d'un coup de chance.

### Décision

```
Décision :   lancer Harnay en abonnement, garde gratuite, Pro 19 $, Team 79 $
Porte :      à double sens (prix, offre et cible se changent en une heure)
Options :    ne rien faire / kit en achat unique / abonnement (retenu)
Pourquoi :   seul l'abonnement compte au MRR ; la raison de rester abonné est réelle
             (formats qui changent, nouvelles règles, npx harnay sync)
Objection la plus forte :
             « le gratuit suffit et Anthropic finira par l'intégrer ». Vrai à 12 mois.
             Sans effet sur 30 jours. La partie durable est la curation par stack
             et la politique d'équipe.
Critères d'arrêt :
             J7  : moins de 300 installations (GET /api/harness en 200)
             J10 : moins de 5 clients payants malgré 3 000 visiteurs
             Dans les deux cas, basculer tout le temps sur le démarchage Team,
             ou changer d'idée tant qu'il reste 20 jours.
```

## 2. Positionnement

**Phrase.** Harnay helps people who ship real products with Claude Code keep the agent off their secrets, their database and their main branch, by installing a tested guard hook, permission rules and working rules in one command.

**Angle.** A rule in a markdown file is a request. Les deux incidents cités sur la landing (Replit en juillet 2025, PocketOS en 2026) ont le même schéma : l'agent avait des consignes écrites et ne les a pas suivies. La documentation de Claude Code le dit elle-même : les fichiers d'instructions sont du contexte, pas une configuration appliquée.

**Cible précise.** Un builder solo avec une app en ligne (Next.js, Supabase, Stripe), des utilisateurs payants ou presque, Claude Code plusieurs heures par jour, souvent en acceptation automatique. Il a eu une frayeur. Il ne sait pas forcément ce qu'est un hook.

**Cible secondaire.** Équipes de 2 à 10 et agences : la même configuration dans chaque dépôt, et un contrôle en CI qui casse le build si quelqu'un désactive la garde.

**Alternatives du client.** Ne rien faire. Un méga-dépôt gratuit de centaines de fichiers. Un week-end à écrire ses propres hooks.

**Ce qui nous distingue, dans l'ordre.**

1. L'application avant la documentation : une garde qui lit la ligne de commande (`git -C . push --force`, `bash -c "..."`), 33 règles, 726 exemples rejoués sur la machine du client.
2. Petit exprès : un fichier de règles de 66 lignes, 9 skills.
3. Tout se lit avant installation, dans le builder.
4. Honnête sur les limites. La section « What it does not do » est un argument de vente pour un produit de sécurité.

**Preuves disponibles aujourd'hui.** Les chiffres de l'auto-test. Le test réel dans Claude Code 2.1.325 (blocage de `cat .env`, de la lecture de `.env`, du force-push). Le code de la garde, lisible.

**Preuves à obtenir la première semaine.** Trois citations de vrais utilisateurs, avec leur accord. Aucune fausse preuve en attendant.

**Voix.** Phrases simples. Le nom de la commande, du fichier, le chiffre. Pas de point d'exclamation, pas de superlatif. On dit ce que le produit ne fait pas.

## 3. Prix

| Offre | Prix | Contenu |
| --- | --- | --- |
| Free | 0 $ | Garde, règles de permission, AGENTS.md, skill de brief, audit, doctor, sync |
| Pro | 19 $ par mois | Templates par stack, packs Quality, Design et Ship, mises à jour |
| Team | 79 $ par mois | Pro pour 10 développeurs sur une clé |

Pas d'essai gratuit : avec 30 jours, un essai de 7 jours retarde le MRR d'autant. À la place, remboursement sous 14 jours et annulation en un clic.

Pas de remise publique. Les codes promo Stripe sont activés au checkout : crée un code par canal (un pour Reddit, un par YouTubeur) pour savoir d'où viennent les ventes et pour conclure une conversation.

## 4. Deux canaux, pas dix

**Canal 1 : contenu avec une vraie donnée.** `npx harnay audit` fonctionne dans n'importe quel dossier, sans rien installer, et liste ce qu'un agent peut y faire. Lance-le sur 100 dépôts publics qui contiennent un CLAUDE.md, compte les résultats, publie les chiffres. C'est une donnée que personne d'autre n'a, et chaque lecteur peut la vérifier sur son propre dépôt en une commande. Ce sont tes chiffres réels qui feront le titre : ne publie rien avant de les avoir.

**Canal 2 : démarchage direct pour le plan Team.** 20 messages par jour à des agences et petites équipes qui affichent Claude Code ou Cursor dans leurs offres. Une conversation, une démo de 10 minutes avec `audit` sur leur dépôt, un code promo.

Ce qu'on ne fait pas ce mois-ci : publicité payante, SEO de fond, Product Hunt comme pari principal, nouveaux agents, tableau de bord, comptes utilisateurs.

## 5. Plan sur 30 jours

**J0 à J1. Mise en ligne.** Les six étapes du README. Enregistre une vidéo de 40 secondes : Claude Code tente `npx prisma migrate reset`, la garde bloque, le message s'affiche. Pas de montage.

**J2 à J3. Vingt personnes.** Fais installer à 20 builders que tu connais, en les regardant faire sans aider. Note où ils butent. Corrige. Demande trois citations.

**J3 à J4. La donnée.** L'audit sur 100 dépôts publics. Un tableau, trois chiffres.

**J4. Lancement.** Fil X avec la vidéo. Post Reddit sur r/ClaudeAI et r/ClaudeCode centré sur la donnée et la commande gratuite, le lien en commentaire. Réponds à tout, toute la journée.

**J5. Show HN.** Un seul essai, en semaine, le matin heure de la côte Est.

**Semaine 2.** Écris à dix créateurs (YouTube, newsletters) qui couvrent Claude Code, avec la donnée et un code promo à leur nom. Teste l'adaptateur Cursor dans Cursor, corrige, et annonce « enforced in Cursor » : c'est un deuxième lancement. Démarchage Team tous les jours.

**Semaine 3.** Livre les deux templates de stack les plus demandés. Chacun est un mini-lancement dans la communauté de cette stack. Ajoute la capture d'e-mail (c'est le manque principal aujourd'hui : les utilisateurs gratuits sont anonymes).

**Semaine 4.** Product Hunt si tu as des soutiens. Relance de tous ceux qui ont eu une réponse 402 visible (ils voulaient Pro). Publie un bilan chiffré du mois : en plein concours, c'est une histoire qui se partage.

**Chaque jour.** 20 messages Team, une réponse à chaque mention, les chiffres relevés.

## 6. Chiffres à suivre

| Chiffre | Où le lire | Seuil |
| --- | --- | --- |
| Visiteurs | Vercel Analytics | 300 par jour après J4 |
| Installations | `GET /api/harness` en 200 | 10 % des visiteurs |
| Intention Pro | `GET /api/harness` en 402 | à relancer par du contenu |
| Checkouts lancés, payés | Stripe | 1 % des visiteurs paient |
| MRR, remboursements, annulations | Stripe | moins de 10 % de remboursements |
| Réponses au démarchage | ton tableur | 5 % de réponses, 1 équipe sur 60 |

## 7. Ce qui peut nous tuer

- Personne ne vient. C'est le risque numéro un, d'où le canal direct.
- Un faux positif de la garde qui agace et se raconte. Parade : la liste `everyday` de l'auto-test (95 commandes courantes qui doivent passer), et `sync` pour corriger chez tout le monde en une heure.
- Un « j'ai contourné Harnay en une ligne ». Ça arrivera : une garde qui lit du texte se contourne. Parade : on le dit déjà nous-mêmes sur la landing et dans la doc, et on corrige vite.
- Quelqu'un publie `harnay` sur npm avant toi. Publie aujourd'hui.

## 8. Textes de lancement

À relire avec tes propres chiffres avant de publier. Les crochets marquent ce que tu dois remplir. Ne publie pas un crochet.

### X, fil de lancement

> 1/ I ran one command on [N] public repos that have a CLAUDE.md.
> [X] had nothing checking a shell command before it runs. [Y] had a .env file the agent could read.
> Check yours: npx harnay audit
>
> 2/ A CLAUDE.md is a request. Claude Code's docs say so: instructions are "context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook."
>
> 3/ So I built the hook. It reads the command the agent is about to run and blocks database resets, .env reads, force-pushes to main and curl | sh. [40-second video]
>
> 4/ 33 rules. Each one carries the commands it must block and the ones it must leave alone: 726 examples that replay on your machine at install.
>
> 5/ It is free, it is plain text in your repo, and you can read every file before installing: harnay.dev/new
> It is also not a sandbox, and the site says what it cannot catch.

### Show HN

Title: `Show HN: Harnay – a guard hook for Claude Code that blocks DB resets and .env reads`

> I use Claude Code on a project with real users. Twice it ran a command I would not have approved if I had read it properly. Instructions in CLAUDE.md did not help, and the docs are clear that they are context, not enforcement.
>
> Harnay is a PreToolUse hook plus permission rules, installed with `npx harnay init`. It parses the command line instead of pattern-matching it, so `git -C . push --force origin main` and `bash -c "..."` are read for what they do. Each rule ships with examples of what it must block, ask about and allow (726 in total), and `npx harnay doctor` replays them locally.
>
> What it is not: a sandbox. It cannot see inside a script it did not watch being written, and a recursive grep can still surface a line from an ignored file. The limits are listed at harnay.dev/docs#limits. I would like to hear what gets past it.
>
> The guard is free. Stack templates and skills are a paid add-on. No account, nothing uploaded, no network calls from the hook.

### Reddit (r/ClaudeAI, r/ClaudeCode)

Title: `I audited [N] public repos with a CLAUDE.md. Here is what an agent could do in them.`

> [Your table: three numbers.]
>
> The audit is one read-only command and works on any folder: `npx harnay audit`. It never opens a secrets file, it only looks at names and at your Claude Code settings.
>
> If it finds something, the fix I built is a hook that checks commands before they run. Free, plain text, link in the comments. Tell me what it gets wrong on your repo.

### Message direct, plan Team

> Hi [name], I saw [agency] builds client projects with Claude Code. Quick question: is the agent setup the same in every client repo, or does each developer have their own?
>
> I make a harness that installs one setup everywhere and fails CI when someone switches the guard off. If you run `npx harnay audit` in one client repo and send me the output, I will tell you what I would change, no charge.

### Product Hunt

Tagline: `A guard hook for Claude Code, installed in one command`
