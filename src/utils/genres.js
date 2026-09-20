export const ALL_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Biopic / Biography",
  "Comedy",
  "Crime",
  "Cyberpunk",
  "Dark Fantasy",
  "Documentary",
  "Drama",
  "Dystopian",
  "Epic / Historical",
  "Family / Children",
  "Fantasy",
  "Film Noir / Neo-Noir",
  "Gothic",
  "High Fantasy",
  "Historical Fiction",
  "Horror",
  "Legal Drama",
  "Martial Arts",
  "Medical",
  "Musical",
  "Mystery",
  "Mythology / Folklore",
  "Political Thriller",
  "Psychological Thriller",
  "Romance",
  "Romantic Comedy",
  "Sci-Fi (Science Fiction)",
  "Slice of Life",
  "Space Opera",
  "Sports",
  "Spy / Espionage",
  "Superhero",
  "Supernatural / Paranormal",
  "Survival",
  "Thriller",
  "Time Travel",
  "Urban Fantasy",
  "War / Military",
  "Western"
];

export function getProjectGenres(project) {
  if (!project) return [];
  const genres = new Set();
  
  if (project.genre1) genres.add(project.genre1);
  if (project.genre2) genres.add(project.genre2);
  if (project.genre3 && project.genre3 !== "NONE" && project.genre3 !== "None") genres.add(project.genre3);

  if (genres.size === 0 && project.subject) {
    // If subject contains slashes
    if (project.subject.includes("/")) {
      project.subject.split("/").map((g) => g.trim()).forEach((g) => {
        if (g) genres.add(g);
      });
    } else {
      genres.add(project.subject);
    }
  }

  return Array.from(genres);
}
