import type { Vaga } from '../types';

export function calculateMatchScore(vaga: Vaga, profileText: string) {
  let score = 0;
  const vagaText = (vaga.titulo + ' ' + vaga.descricao).toLowerCase();
  const profileWords = profileText.split(/\W+/).filter((w) => w.length > 3);

  profileWords.forEach((word) => {
    if (vagaText.includes(word)) {
      score += 1;
    }
  });

  if (
    vaga.titulo
      .toLowerCase()
      .split(/\W+/)
      .some((word) => word.length > 3 && profileText.includes(word))
  ) {
    score += 5;
  }

  return score;
}
