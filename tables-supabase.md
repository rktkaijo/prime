# Tables Supabase — Reload Prime

> Projet : Reload Prime (recharge de crédits de jeux en ligne, Madagascar)  
> Backend : Supabase (PostgreSQL)  
> Total : **15 tables** + **1 bucket Storage**

---

## Vue d'ensemble

| # | Table | Rôle principal |
|---|-------|----------------|
| 1 | `profiles` | Profils utilisateurs |
| 2 | `orders` | Commandes clients |
| 3 | `packs` | Packs de crédits de jeux |
| 4 | `games` | Jeux disponibles |
| 5 | `transactions` | Historique des transactions |
| 6 | `wallet_recharge_requests` | Demandes de recharge du wallet |
| 7 | `prepaid_cards` | Cartes prépayées |
| 8 | `carousel_images` | Images du carousel d'accueil |
| 9 | `promo_banners` | Bannières promotionnelles |
| 10 | `reviews` | Avis clients |
| 11 | `config` | Configuration générale du site |
| 12 | `notifications` | Notifications utilisateurs |
| 13 | `chat_messages` | Messages du chat support |
| 14 | `chat_sessions` | Sessions du chat support |
| — | `chat-images` | **Bucket Storage** (images du chat) |

---

## Détail des tables

---

### 1. `profiles`
Stocke les informations de profil de chaque utilisateur (lié à `auth.users` de Supabase).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant utilisateur (= `auth.users.id`) |
| `display_name` | text | Nom affiché |
| `user_email` | text | Email |
| `balance` | numeric | Solde du wallet (Ariary) |
| `prime_points` | integer | Points de fidélité |
| `created_at` | timestamptz | Date de création |
| `updated_at` | timestamptz | Dernière mise à jour |

**Alias JS créés par `normalizeRow`** :
- `display_name` → `displayName`
- `user_id` → `userId`, `uid`
- `balance` → `walletBalance`
- `prime_points` → `primePoints`

---

### 2. `orders`
Enregistre chaque commande passée par un client.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant interne |
| `order_id` | text | Référence affichée au client (ex. `RP-20260801-XXXX`) |
| `user_id` | uuid (FK → profiles) | Acheteur |
| `game_id` | text | Jeu concerné |
| `total_amount` | numeric | Montant total (Ariary) |
| `payment_method` | text | `orange_money` ou `mvola` |
| `payer_phone` | text | Numéro de téléphone du payeur |
| `transaction_ref` | text | Référence de paiement opérateur |
| `player_info` | text | Identifiant joueur (ID en jeu) |
| `status` | text | `pending` / `confirmed` / `cancelled` |
| `created_at` | timestamptz | Date de la commande |
| `user_email` | text | Email acheteur (redondant pour admin) |
| `contact_name` | text | Nom du contact |

---

### 3. `packs`
Catalogue des packs de crédits vendus pour chaque jeu.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `game_id` | text (FK → games.id) | Jeu auquel appartient le pack |
| `name` | text | Nom du pack (ex. "100 Diamonds") |
| `amount` | integer | Quantité de ressources (diamonds, UC…) |
| `price` / `price_mga` | numeric | Prix en Ariary |
| `image_url` | text | URL de l'image du pack |
| `popular` | boolean | Mise en avant "Populaire" |
| `bonus` | text | Bonus inclus (ex. "10% de bonus") |
| `active` | boolean | Visible ou masqué |
| `sort_order` | integer | Ordre d'affichage |
| `category` | text | Catégorie (pour le filtre onglets) |
| `created_at` | timestamptz | Date de création |

---

### 4. `games`
Catalogue des jeux disponibles sur la plateforme.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | text (PK) | Identifiant slug du jeu (ex. `free-fire`) |
| `name` | text | Nom affiché |
| `description` | text | Description courte |
| `color` | text | Couleur d'accent hex (ex. `#FF6B00`) |
| `currency_label` | text | Nom de la monnaie (ex. `Diamonds`, `UC`) |
| `card_image_url` | text | Image de la carte jeu (grille d'accueil) |
| `image_url` | text | Image icône |
| `banner_url` | text | Image bannière hero |
| `is_new` | boolean | Badge "NEW" |
| `available` | boolean | Jeu actif |
| `active` | boolean | Alias de `available` |
| `sort_order` | integer | Ordre dans la grille |
| `categories` | jsonb | Tableau de catégories `[{id, label}]` |
| `created_at` | timestamptz | Date de création |

---

### 5. `transactions`
Historique de toutes les transactions financières (commandes, recharges wallet…).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `user_id` | uuid (FK → profiles) | Utilisateur |
| `type` | text | `order` / `wallet_recharge` / `refund` |
| `amount` | numeric | Montant (Ariary) |
| `status` | text | `pending` / `success` / `failed` |
| `reference` | text | Référence de la transaction |
| `created_at` | timestamptz | Date |

---

### 6. `wallet_recharge_requests`
Demandes de recharge manuelle du wallet via Orange Money ou Mvola.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `user_id` | uuid (FK → profiles) | Utilisateur |
| `amount` | numeric | Montant demandé (Ariary) |
| `payment_method` | text | `orange_money` / `mvola` |
| `payer_phone` | text | Numéro du payeur |
| `transaction_ref` | text | Référence opérateur |
| `status` | text | `pending` / `approved` / `rejected` |
| `created_at` | timestamptz | Date de la demande |

---

### 7. `prepaid_cards`
Stock de cartes prépayées disponibles à la vente.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `code` | text | Code secret de la carte |
| `value` | numeric | Valeur en Ariary |
| `game_id` | text | Jeu associé (optionnel) |
| `sold` | boolean | Carte vendue ou non |
| `sold_to` | uuid | user_id de l'acheteur |
| `created_at` | timestamptz | Date de création |

---

### 8. `carousel_images`
Images du carousel principal sur la page d'accueil.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `url` / `image_url` | text | URL de l'image |
| `title` | text | Titre affiché |
| `subtitle` | text | Sous-titre |
| `link` | text | URL de destination au clic |
| `sort_order` | integer | Ordre dans le carousel |
| `active` | boolean | Visible ou masqué |
| `created_at` | timestamptz | Date de création |

> Le carousel s'actualise en **temps réel** via Supabase Realtime :  
> `_SB.channel('carousel-realtime').on('postgres_changes', { table:'carousel_images' }, fetch).subscribe()`

---

### 9. `promo_banners`
Bannières promotionnelles affichées dans l'application.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `image_url` | text | URL de la bannière |
| `title` | text | Texte principal |
| `color` / `glow_color` | text | Couleur d'accent |
| `btn_from` / `btn_to` | text | Gradient du bouton |
| `border_color` | text | Couleur de bordure |
| `gradient_from` / `gradient_to` | text | Gradient de fond |
| `card_bg` | text | Couleur de fond de la carte |
| `link` | text | URL au clic |
| `active` | boolean | Visible ou masqué |
| `sort_order` | integer | Ordre d'affichage |

---

### 10. `reviews`
Avis clients affichés sur la page d'accueil.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `user_id` | uuid | Auteur |
| `game_id` | text | Jeu concerné |
| `rating` | integer | Note (1–5) |
| `text` | text | Texte de l'avis |
| `author` | text | Nom affiché |
| `approved` | boolean | Validé par l'admin |
| `created_at` | timestamptz | Date |

---

### 11. `config`
Paramètres globaux du site (modifiables depuis le panel admin).

| Colonne | Type | Description |
|---------|------|-------------|
| `key` | text (PK) | Clé de configuration |
| `value` | text / jsonb | Valeur |
| `updated_at` | timestamptz | Dernière modification |

Exemples de clés :
- `site_maintenance` → mode maintenance activé/désactivé
- `orange_money_number` → numéro Orange Money du marchand
- `mvola_number` → numéro Mvola du marchand
- `promo_message` → message promo global

---

### 12. `notifications`
Notifications push envoyées aux utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `user_id` | uuid (FK → profiles) | Destinataire |
| `title` | text | Titre |
| `body` | text | Contenu |
| `read` | boolean | Lu ou non |
| `type` | text | `order` / `promo` / `system` |
| `data` | jsonb | Données supplémentaires |
| `created_at` | timestamptz | Date d'envoi |

---

### 13. `chat_messages`
Messages individuels du chat support en temps réel.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant |
| `session_id` | uuid (FK → chat_sessions) | Session parente |
| `sender` | text | `user` / `agent` / `bot` |
| `content` | text | Texte du message |
| `image_url` | text | URL d'image jointe (optionnel) |
| `created_at` | timestamptz | Date d'envoi |

---

### 14. `chat_sessions`
Sessions de conversation entre un client et le support.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant de session |
| `user_id` | uuid (FK → profiles) | Client |
| `status` | text | `open` / `closed` |
| `last_message_at` | timestamptz | Date du dernier message |
| `created_at` | timestamptz | Date d'ouverture |

---

## Bucket Storage

### `chat-images`
Stocke les images envoyées dans le chat support.

- **Accès** : lecture publique (URL directe)  
- **Upload** : via `_SB.storage.from('chat-images').upload(path, file)`
- **URL** : `_SB.storage.from('chat-images').getPublicUrl(path)`

---

## Notes techniques

### Normalisation des colonnes (`normalizeRow`)
Toutes les lignes récupérées de Supabase passent par `normalizeRow()` qui crée des alias camelCase :

```
snake_case        →  camelCase JS
─────────────────────────────────
created_at        →  createdAt  (objet {toDate(), seconds, nanoseconds})
user_id           →  userId, uid
game_id           →  gameId
display_name      →  displayName
balance           →  walletBalance
prime_points      →  primePoints
order_id          →  orderId
total_amount      →  totalAmount
payment_method    →  paymentMethod
payer_phone       →  payerPhone
transaction_ref   →  transactionId
image_url         →  imageUrl, indexImage
card_image_url    →  cardImage
banner_url        →  bannerImage
currency_label    →  currencyLabel, currency
is_new            →  isNew
price_mga         →  priceMga
player_info       →  playerInfo, gameInfo
color             →  accentColor
```

### Realtime
Seul le carousel utilise Supabase Realtime (écoute des changements `INSERT`/`UPDATE`/`DELETE` sur `carousel_images`).

### Sécurité
- Row Level Security (RLS) doit être activé sur toutes les tables contenant des données personnelles.
- La clé `anon` (publique) est utilisée côté client — elle ne donne accès qu'aux données autorisées par les politiques RLS.
- Les opérations admin (validation commandes, gestion utilisateurs) doivent utiliser la clé `service_role` **uniquement côté serveur**.
