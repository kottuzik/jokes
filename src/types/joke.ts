export interface Joke {
  id: string
  text: string
  language?: string
}

export interface JokeRequest {
  topic: string
  previousJokes: string[]
}
