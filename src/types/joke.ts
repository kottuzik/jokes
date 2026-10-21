export interface Joke {
  id: string
  text: string
  language?: string
}

export interface JokeRequest {
  topic: string
  previousJokes: string[]
}

// Screen-reader message; the id changes on every message so repeats are announced
export interface Announcement {
  text: string
  id: number
}
