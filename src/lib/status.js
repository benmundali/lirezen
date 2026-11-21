export function statusLabel(status) {
  const labels = {
    a_lire: "À lire",
    en_cours: "En cours",
    termine: "Terminé",
  };
  return labels[status] ?? "Inconnu";
}
