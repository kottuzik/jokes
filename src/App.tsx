import Header from './components/Header.tsx'
import Illustration from './components/Illustration.tsx'
import JokeForm from './components/JokeForm.tsx'
import JokeList from './components/JokeList.tsx'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Illustration />
        <JokeForm />
        <JokeList />
      </main>
    </div>
  )
}
