/**
 * ══════════════════════════════════════════════════════════════
 *  SUPABASE — Intégration dans Reload Prime
 *  Ce fichier explique et reproduit TOUT ce qui fait fonctionner
 *  Supabase dans le site (initialisation, client, helpers, CRUD).
 * ══════════════════════════════════════════════════════════════
 *
 *  Ordre de chargement dans index.html :
 *    1. <script src="/supabase-config.js">   → définit window.__SB_URL et window.__SB_ANON
 *    2. <script src="/supabase-sdk.js">      → charge @supabase/supabase-js (bundle UMD)
 *    3. <script type="module">               → ce bloc (toute la logique JS du site)
 */


/* ════════════════════════════════════════════
   ÉTAPE 1 — CONFIGURATION (supabase-config.js)
   ════════════════════════════════════════════
   Ce fichier contient les identifiants publics du projet Supabase.
   Il est SÉPARÉ pour pouvoir être remplacé sans toucher au code.

   Contenu de supabase-config.js :
   ─────────────────────────────────
   window.__SB_URL  = "https://<project-ref>.supabase.co";
   window.__SB_ANON = "sb_publishable_<clé_anon_publique>";

   ⚠️  La clé anon est PUBLIQUE (lisible dans le source).
       Elle ne donne accès qu'à ce qu'autorisent les règles RLS.
       Ne jamais mettre la clé service_role côté client.
*/


/* ════════════════════════════════════════════
   ÉTAPE 2 — INITIALISATION DU CLIENT
   ════════════════════════════════════════════
   Dans le <script type="module"> principal de index.html :
*/
const _sbCreate = window.supabase.createClient;  // exposé par supabase-sdk.js
const supabase  = _sbCreate(window.__SB_URL || '', window.__SB_ANON || '');
const _SB       = supabase;
window._SB      = _SB;   // rendu global pour les modules qui en ont besoin

/* Le client _SB expose :
   - _SB.from(table)          → requêtes CRUD (select, insert, update, delete)
   - _SB.auth                 → authentification (signIn, signOut, getUser…)
   - _SB.storage              → Storage (upload, getPublicUrl…)
   - _SB.channel(name)        → Realtime (écoute des changements en BDD)
*/


/* ════════════════════════════════════════════
   ÉTAPE 3 — NORMALISATION DES LIGNES
   ════════════════════════════════════════════
   Supabase retourne des colonnes en snake_case.
   normalizeRow() crée des alias camelCase pour la compatibilité
   avec le reste du code JS (qui utilise parfois les deux formes).
*/
function normalizeRow(row) {
  if (!row) return null;
  const d = { ...row };

  /* Dates → objet compatible avec l'ancienne API Firebase Timestamp */
  if (d.created_at)        { const dt = new Date(d.created_at);        d.createdAt      = { toDate: () => dt, seconds: Math.floor(dt / 1000), nanoseconds: 0 }; }
  if (d.updated_at)        { const dt = new Date(d.updated_at);        d.updatedAt      = { toDate: () => dt, seconds: Math.floor(dt / 1000) }; }
  if (d.last_message_at)   { const dt = new Date(d.last_message_at);   d.lastMessageAt  = { toDate: () => dt, seconds: Math.floor(dt / 1000) }; d.lastAt = d.lastMessageAt; }

  /* Identifiants */
  if (d.user_id)           { d.userId = d.user_id;          d.uid    = d.user_id; }
  if (d.game_id)           { d.gameId = d.game_id; }
  if (d.order_id)          { d.orderId = d.order_id; }

  /* Profil */
  if (d.display_name)      { d.displayName  = d.display_name; }
  if (d.balance !== undefined)     { d.walletBalance = d.balance; }
  if (d.prime_points !== undefined){ d.primePoints   = d.prime_points; }
  if (d.user_email)        { d.userEmail   = d.user_email; }
  if (d.contact_name)      { d.contactName = d.contact_name; }

  /* Commandes / transactions */
  if (d.total_amount !== undefined){ d.totalAmount  = d.total_amount; d.amount = d.amount || d.total_amount; }
  if (d.payment_method)    { d.paymentMethod  = d.payment_method; }
  if (d.payer_phone)       { d.payerPhone     = d.payer_phone; }
  if (d.transaction_ref)   { d.transactionId  = d.transaction_ref; }
  if (d.player_info)       { d.playerInfo     = d.player_info; d.gameInfo = d.player_info; }
  if (d.created_at_local)  { d.createdAtLocal = d.created_at_local; }

  /* Disponibilité / tri */
  if (d.active !== undefined && d.available === undefined) { d.available = d.active; }
  if (d.sort_order !== undefined && d.order === undefined) { d.order     = d.sort_order; }

  /* Images */
  if (d.image_url)         { d.imageUrl    = d.image_url; d.indexImage = d.image_url; }
  if (d.card_image_url)    { d.cardImage   = d.card_image_url; }
  if (d.banner_url)        { d.bannerImage = d.banner_url; }
  if (d.url && !d.imageUrl){ d.imageUrl    = d.url; }

  /* Jeux */
  if (d.currency_label)    { d.currencyLabel = d.currency_label; d.currency = d.currency || d.currency_label; }
  if (d.currency_emoji)    { d.currencyEmoji = d.currency_emoji; }
  if (d.is_new)            { d.isNew         = d.is_new; }

  /* Packs */
  if (d.price_mga)         { d.priceMga = d.price_mga; }
  if (d.pack_types)        { d.packTypes = d.pack_types; }

  /* Couleurs / style */
  if (d.color)             { d.accentColor    = d.color; }
  if (d.glow_color)        { d.glowColor      = d.glow_color; }
  if (d.btn_from)          { d.btnFrom        = d.btn_from; }
  if (d.btn_to)            { d.btnTo          = d.btn_to; }
  if (d.border_color)      { d.borderColor    = d.border_color; }
  if (d.gradient_from)     { d.gradientFrom   = d.gradient_from; }
  if (d.gradient_to)       { d.gradientTo     = d.gradient_to; }
  if (d.card_bg)           { d.cardBg         = d.card_bg; }

  return d;
}
window._normalizeRow = normalizeRow;


/* ════════════════════════════════════════════
   ÉTAPE 4 — AUTHENTIFICATION
   ════════════════════════════════════════════ */

/**
 * Récupère l'utilisateur connecté et son profil.
 */
async function getCurrentUser() {
  const { data: { user } } = await _SB.auth.getUser();
  if (!user) return null;

  const { data: profile } = await _SB
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile ? normalizeRow(profile) : user;
}

/**
 * Connexion avec email + mot de passe.
 */
async function signIn(email, password) {
  const { data, error } = await _SB.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

/**
 * Inscription.
 */
async function signUp(email, password) {
  const { data, error } = await _SB.auth.signUp({ email, password });
  if (error) throw error;
  return data.user;
}

/**
 * Déconnexion.
 */
async function signOut() {
  await _SB.auth.signOut();
}

/**
 * Écoute les changements d'état d'authentification.
 * Callback appelé à chaque connexion/déconnexion.
 */
_SB.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN')  { /* session.user disponible */ }
  if (event === 'SIGNED_OUT') { /* nettoyer l'UI */ }
});


/* ════════════════════════════════════════════
   ÉTAPE 5 — EXEMPLES DE REQUÊTES CRUD
   ════════════════════════════════════════════ */

/* ── SELECT simple ── */
async function exampleSelect() {
  // Tous les jeux actifs, triés par sort_order
  const { data, error } = await _SB
    .from('games')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeRow);
}

/* ── SELECT avec filtre sur un seul enregistrement ── */
async function exampleSelectOne(gameId) {
  const { data, error } = await _SB
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();                // retourne un objet, pas un tableau

  if (error) throw error;
  return normalizeRow(data);
}

/* ── SELECT avec plusieurs filtres ── */
async function exampleSelectFiltered(gameId) {
  const { data, error } = await _SB
    .from('packs')
    .select('*')
    .eq('game_id', gameId)
    .eq('active', true)
    .order('amount', { ascending: true });

  if (error) throw error;
  return (data || []).map(normalizeRow);
}

/* ── INSERT ── */
async function exampleInsert(userId, packData) {
  const { data, error } = await _SB
    .from('orders')
    .insert({
      user_id       : userId,
      game_id       : packData.gameId,
      total_amount  : packData.price,
      payment_method: 'orange_money',
      payer_phone   : '034xxxxxxx',
      player_info   : 'ID_JOUEUR_123',
      status        : 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return normalizeRow(data);
}

/* ── UPDATE ── */
async function exampleUpdate(orderId, newStatus) {
  const { error } = await _SB
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) throw error;
}

/* ── UPSERT (insert ou update si existe déjà) ── */
async function exampleUpsert(userId, profileData) {
  const { error } = await _SB
    .from('profiles')
    .upsert({
      id          : userId,
      display_name: profileData.displayName,
      updated_at  : new Date().toISOString()
    });

  if (error) throw error;
}

/* ── DELETE ── */
async function exampleDelete(notifId) {
  const { error } = await _SB
    .from('notifications')
    .delete()
    .eq('id', notifId);

  if (error) throw error;
}


/* ════════════════════════════════════════════
   ÉTAPE 6 — REALTIME (temps réel)
   ════════════════════════════════════════════
   Utilisé pour le carousel d'accueil :
   les images se mettent à jour sans rechargement de page.
*/
function subscribeCarouselRealtime(onUpdate) {
  _SB
    .channel('carousel-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'carousel_images' },
      (payload) => {
        console.log('Carousel changé:', payload);
        onUpdate(payload);
      }
    )
    .subscribe();
}

/* Exemple d'utilisation : */
// subscribeCarouselRealtime(() => loadCarousel());


/* ════════════════════════════════════════════
   ÉTAPE 7 — STORAGE (images du chat)
   ════════════════════════════════════════════ */

/**
 * Envoyer une image dans le chat.
 * Stocke dans le bucket "chat-images".
 */
async function uploadChatImage(file, sessionId) {
  const ext  = file.name.split('.').pop();
  const path = `${sessionId}/${Date.now()}.${ext}`;

  const { error } = await _SB.storage
    .from('chat-images')
    .upload(path, file, { contentType: file.type });

  if (error) throw error;

  // Récupérer l'URL publique
  const { data } = _SB.storage.from('chat-images').getPublicUrl(path);
  return data.publicUrl;
}


/* ════════════════════════════════════════════
   ÉTAPE 8 — ATTENDRE QUE _SB SOIT PRÊT
   ════════════════════════════════════════════
   Le script principal est un <script type="module">,
   qui est différé. D'autres scripts (ex. carousel)
   peuvent être chargés avant que _SB soit initialisé.
   Ce helper attend que window._SB soit disponible.
*/
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window._SB) { resolve(window._SB); return; }
    const t = setInterval(() => {
      if (window._SB) { clearInterval(t); resolve(window._SB); }
    }, 80);
  });
}
window.waitForSupabase = waitForSupabase;

/* Exemple d'utilisation dans un autre script : */
// waitForSupabase().then(_SB => { _SB.from('games').select('*').then(console.log); });


/* ════════════════════════════════════════════
   ÉTAPE 9 — FORMATAGE ARIARY
   ════════════════════════════════════════════ */
function fmtAr(v) {
  return new Intl.NumberFormat('fr-FR').format(Number(v || 0)) + ' Ar';
}
window.fmtAr = fmtAr;
// Exemple : fmtAr(12500) → "12 500 Ar"


/* ════════════════════════════════════════════
   RÉSUMÉ DES APPELS SUPABASE PAR TABLE
   ════════════════════════════════════════════

   Table               | Opérations utilisées dans le site
   ─────────────────────────────────────────────────────────
   games               | SELECT (accueil, page jeux, chargement packs)
   packs               | SELECT (par game_id, ou tous avec filtre JS)
   profiles            | SELECT (profil connecté), UPDATE (balance, points)
   orders              | SELECT (historique), INSERT (nouvelle commande)
   transactions        | SELECT (historique wallet)
   notifications       | SELECT (liste), UPDATE (marquer lu)
   wallet_recharge_    | INSERT (demande recharge), SELECT (statut)
     requests          |
   prepaid_cards       | SELECT (liste cartes), UPDATE (marquer vendue)
   carousel_images     | SELECT + Realtime (temps réel)
   promo_banners       | SELECT (bannières actives)
   reviews             | SELECT (avis approuvés)
   config              | SELECT (paramètres site : numéros paiement, etc.)
   chat_sessions       | SELECT (session active), INSERT (nouvelle session)
   chat_messages       | SELECT (messages), INSERT (envoyer message)
   chat-images (bucket)| UPLOAD (image), getPublicUrl

   ══════════════════════════════════════════════════════════
*/
