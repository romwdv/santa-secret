# Déploiement

Secret Santa est déployé comme une image Docker unique, construite par GitHub
Actions et poussée sur **GitHub Container Registry**. Coolify la récupère et la
lance. Voir `Dockerfile`, `.dockerignore` et `.github/workflows/deploy.yml`.

- Image : `ghcr.io/romwdv/santa-secret`
- Registre : **public** — aucune authentification n'est nécessaire pour tirer
  l'image, ni pour Coolify, ni pour un `docker pull` local.

---

## 1. La variable GitHub

Une seule variable est nécessaire dans le dépôt, car elle est **inlinée dans le
bundle au moment du build** :

**Settings → Secrets and variables → Actions → tab `Variables` → New
repository variable**

| Nom | Valeur |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |

> Elle est dans l'onglet **Variables**, pas **Secrets** : c'est l'URL du projet,
> une donnée publique présente dans le bundle client. Le mettre dans Secrets
> fonctionnerait également, mais ne représente pas ce qu'elle est.

**Aucun secret GitHub n'est nécessaire.** Le `GITHUB_TOKEN` fourni par Actions
pousse dans GHCR, à condition que le dépôt autorise les workflows
(*Settings → Actions → General → Workflow permissions → Read and write*) —
c'est le réglage par défaut.

---

## 2. Premier push

```bash
git push origin main
```

Le workflow `Déploiement` construit et pousse deux tags :

- `latest` — toujours la dernière image de `main`
- `<sha du commit>` — image immuable, pour revenir en arrière si besoin

---

## 3. Les variables du conteneur

Celles-ci sont lues **au démarrage**, pas au build. Elles se configurent dans
Coolify (étape suivante) et peuvent changer sans reconstruire l'image.

| Variable | Au build | Au runtime | Rôle |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | oui | **oui** | Inlinée dans le bundle client *et* lue par le code serveur (`src/lib/supabase/`) |
| `SUPABASE_ANON_KEY` | non | oui | Session admin (`@supabase/ssr`) |
| `SUPABASE_SECRET_KEY` | non | oui | Lectures/écritures de l'app |

> `NEXT_PUBLIC_SUPABASE_URL` est la seule à être requise aux **deux** étapes. Le
> préfixe `NEXT_PUBLIC_` ne signifie pas « variable publique donc optionnelle » :
> Next l'inline dans le bundle client au build, mais le code serveur la lit encore
> dans `process.env` à l'exécution. Sans elle, les pages statiques répondent
> (/connexion) alors que tout ce qui touche Supabase échoue — un symptôme trompeur
> qui donne l'impression que l'app est partiellement déployée.

> Le build échoue volontairement si la variable est absente (`Dockerfile`), pour
> que le bundle ne parte jamais avec une URL vide.

---

## 4. Coolify

1. **New Resource → Application → Docker Image**
2. **Image** : `ghcr.io/romwdv/santa-secret:latest`
   (mets le tag précis `:sha-abc123` plutôt que `latest` pour un déploiement
   reproductible — c'est le rôle du deuxième tag)
3. **Port** : **80:80**. Coolify injecte sa propre variable `PORT=80`, le serveur
   Next la respecte (`Network: http://0.0.0.0:80` dans les logs) — un mapping
   `3000:3003` ne pointe sur rien d'écouté et Traefik répond `503 No available
   server`.
4. **Health check** : `/connexion`, port 80. `/` n'est pas une page publique :
   elle redirige en `307`.
5. **Environment variables** : les **trois** variables du tableau ci-dessus
6. **Domaines** : ton domaine, port 443, HTTPS activé

### Ce que Coolify ne doit PAS faire

- **Ne pas rebuild depuis les sources.** Coolify consomme l'image déjà construite
  par Actions. Rebuilder sur Coolify feraitinstaller les dépendances dans une
  image Debian complète, en perdant tout l'intérêt du `standalone`.
- **Ne pas exposer `SUPABASE_SECRET_KEY` côté client.** Elle n'est lue que par le
  serveur.

---

## 5. Vérifier une image en local

Docker peut tourner via **Colima** (installé avec `brew install colima docker
docker-buildx`, démarré par `colima start -c 2 -m 4 -d 25`). C'est ce qui a
servi à valider cette image : 297 Mo, réponse `307` sur `/`, conteneur `healthy`.

```bash
docker build -t santa:local \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co .

docker run --rm -p 3000:3000 \
  -e SUPABASE_ANON_KEY=sb_publishable_xxx \
  -e SUPABASE_SECRET_KEY=sb_secret_xxx \
  santa:local

curl -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
# attendu : 307 (redirection vers /connexion)
```

---

## 7. Déploiement automatique

Coolify n'a aucune raison de redéployer seul : la ressource est de type
*Docker Image*, sans dépôt Git rattaché. Son *Deploy on push* ne concerne que
les applications connectées à un dépôt — ici, c'est Actions qui construit, donc
c'est Actions qui demande le redéploiement.

### Récupérer l'URL du webhook

Dans la ressource → onglet **Webhooks** → *Deploy Webhook*. Copie l'URL.

### Créer les secrets GitHub

*Settings → Secrets and variables → Actions → onglet **Secrets***

| Nom | Valeur |
| --- | --- |
| `COOLIFY_WEBHOOK` | l'URL de Deploy Webhook copiée ci-dessus |

`COOLIFY_TOKEN` n'est nécessaire que si ton webhook exige une authentification
(URL versionnée avec un token). Dans ce cas, ajoute un second secret contenant
ce token.

### Ce qui se passe

```
push sur main  →  Actions construit  →  push GHCR  →  POST webhook  →  Coolify tire latest
```

L'appel au webhook est **placé après** le push vers GHCR, volontairement :
Coolify tire le tag `latest`, qui doit déjà pointer la nouvelle image.

Tant que `COOLIFY_WEBHOOK` n'est pas défini, le script le détecte, affiche une
notice et quitte sans erreur — l'image est publiée, seul le déploiement manuel
est nécessaire. Le test est fait dans le script et non dans un `if:` de step :
le contexte `secrets` n'y est pas accessible, GitHub refuse de valider le
workflow.

### Vérifier

1. Pousser un commit sur `main`
2. Onglet **Actions** : le run se termine sur `Déployer sur Coolify`
3. Dans Coolify, un nouveau déploiement apparaît, déclenché par le webhook
4. Le conteneur redémarre sur la nouvelle image

---

## 8. Revenir en arrière

Le tag par SHA est immuable. En cas de régression :

```bash
docker pull ghcr.io/romwdv/santa-secret:<sha-du-bon-commit>
```

puis, dans Coolify, pointer l'image sur ce tag et redéployer.