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

| Variable | Nécessaire au build | Nécessaire au runtime | Rôle |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | oui | — | Inlinée dans le bundle |
| `SUPABASE_ANON_KEY` | non | oui | Session admin (`@supabase/ssr`) |
| `SUPABASE_SECRET_KEY` | non | oui | Lectures/écritures de l'app |

> `NEXT_PUBLIC_SUPABASE_URL` n'est plus lisible au runtime : Next l'a figée dans
> le bundle. Changer l'URL du projet Supabase impose de reconstruire l'image,
> donc de repusher un commit.

---

## 4. Coolify

1. **New Resource → Application → Docker Image**
2. **Image** : `ghcr.io/romwdv/santa-secret:latest`
   (mets le tag précis `:sha-abc123` plutôt que `latest` pour un déploiement
   reproductible — c'est le rôle du deuxième tag)
3. **Port** : `3000`
4. **Health check** : `/` — le serveur répond `307` quand la session manque,
   c'est un comportement normal, pas une panne
5. **Environment variables** : les deux clés du tableau ci-dessus, plus une
   URL de domaine public
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

## 6. Revenir en arrière

Le tag par SHA est immuable. En cas de régression :

```bash
docker pull ghcr.io/romwdv/santa-secret:<sha-du-bon-commit>
```

puis, dans Coolify, pointer l'image sur ce tag et redéployer.