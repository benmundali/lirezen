<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { supabase } from "./supabase";
const session = ref(null);
const email = ref("");
const password = ref("");
const mode = ref("connexion");
const title = ref("");
const author = ref("");
const books = ref([]);
const message = ref("");
const busy = ref(false);
let subscription;

// fonctions async 1
async function authenticate() {
  message.value = "";
  busy.value = true;
  try {
    const credentials = { email: email.value, password: password.value };
    const result =
      mode.value === "inscription"
        ? await supabase.auth.signUp({
            ...credentials,
            options: { emailRedirectTo: `${window.location.origin}/` },
          })
        : await supabase.auth.signInWithPassword(credentials);
    if (result.error) throw result.error;
    message.value =
      mode.value === "inscription"
        ? "Inscription envoyée. Vérifie ton e-mail si demandé."
        : "Connexion réussie.";
  } catch (err) {
    message.value = err.message;
  } finally {
    busy.value = false;
  }
}

// fonctions async 2
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) message.value = error.message;
}

// fonctions async 3
async function loadBooks() {
  const owner = session.value?.user.id;
  if (!owner) {
    books.value = [];
    return;
  }
  const { data, error } = await supabase
    .from("books")
    .select("id,title,author,status,created_at")
    .order("created_at", { ascending: false });
  if (session.value?.user.id !== owner) return;
  if (error) message.value = error.message;
  else books.value = data ?? [];
}

// fonctions async 4
async function addBook() {
  if (!title.value.trim() || !session.value) return;
  const { error } = await supabase.from("books").insert({
    title: title.value.trim(),
    author: author.value.trim(),
    user_id: session.value.user.id,
  });
  if (error) {
    message.value = error.message;
    return;
  }
  title.value = "";
  author.value = "";
  await loadBooks();
}

// fonctions async 5
async function changeStatus(id, status) {
  const { error } = await supabase
    .from("books")
    .update({ status })
    .eq("id", id);
  if (error) message.value = error.message;
  else await loadBooks();
}

// fonctions async 6
async function deleteBook(id) {
  if (!window.confirm("Supprimer ce livre ?")) return;
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) message.value = error.message;
  else await loadBooks();
}

onMounted(async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) message.value = error.message;
  session.value = data?.session ?? null;
  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, newSession) => {
      session.value = newSession;
    },
  );
  subscription = listener.subscription;
});
onUnmounted(() => subscription?.unsubscribe());
watch(session, () => {
  books.value = [];
  void loadBooks();
});
</script>

<template>
  <main class="wrap">
    <header>
      <h1>LireZen</h1>
      <p>Mon carnet de lecture</p>
    </header>
    <p v-if="message" role="status" class="message">{{ message }}</p>
    <section v-if="!session" class="panel">
      <h2>{{ mode === "connexion" ? "Connexion" : "Inscription" }}</h2>
      <form @submit.prevent="authenticate">
        <label>E-mail <input v-model="email" type="email" required /></label>
        <label
          >Mot de passe
          <input v-model="password" type="password" minlength="6" required />
        </label>
        <button :disabled="busy" type="submit">Valider</button>
      </form>
      <button
        class="link"
        @click="mode = mode === 'connexion' ? 'inscription' : 'connexion'"
      >
        {{ mode === "connexion" ? "Créer un compte" : "Déjà inscrit ?" }}
      </button>
    </section>
    <section v-else>
      <div class="toolbar">
        <span>{{ session.user.email }}</span>
        <button @click="signOut">Déconnexion</button>
      </div>
      <form class="panel" @submit.prevent="addBook">
        <h2>Ajouter un livre</h2>
        <label>Titre <input v-model="title" required /></label>
        <label>Auteur <input v-model="author" /></label>
        <button type="submit">Ajouter</button>
      </form>
      <h2>Mes livres ({{ books.length }})</h2>
      <p v-if="books.length === 0">Aucun livre pour l'instant.</p>
      <article v-for="book in books" :key="book.id" class="book">
        <div>
          <strong>{{ book.title }}</strong>
          <p>{{ book.author }}</p>
        </div>
        <select
          :value="book.status"
          @change="changeStatus(book.id, $event.target.value)"
        >
          <option value="a_lire">À lire</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
        </select>
        <button @click="deleteBook(book.id)">Supprimer</button>
      </article>
    </section>
  </main>
</template>

<style></style>
