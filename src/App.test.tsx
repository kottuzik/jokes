import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import indexHtml from '../index.html?raw'
import App from './App.tsx'

describe('Main screen', () => {
  it('shows the product title as the main heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'בדיחה בקליק' })).toBeInTheDocument()
  })

  it('has an optional, labelled topic field', () => {
    render(<App />)
    const input = screen.getByRole('textbox', { name: 'בחר נושא לבדיחה' })
    expect(input).not.toBeRequired()
    expect(input).toHaveValue('')
  })

  it('keeps Hebrew and English text while typing and allows clearing it', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByRole('textbox', { name: 'בחר נושא לבדיחה' })

    await user.type(input, 'חתולים')
    expect(input).toHaveValue('חתולים')

    await user.type(input, ' and cats')
    expect(input).toHaveValue('חתולים and cats')

    await user.clear(input)
    expect(input).toHaveValue('')
  })

  it('has an enabled create button that does not change the screen yet', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByRole('textbox', { name: 'בחר נושא לבדיחה' })
    const button = screen.getByRole('button', { name: 'צור בדיחה' })
    expect(button).toBeEnabled()

    await user.type(input, 'חיות')
    await user.click(button)

    expect(input).toHaveValue('חיות')
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows an empty jokes list under its heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 2, name: 'רשימת בדיחות' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'רשימת בדיחות' })).toBeEmptyDOMElement()
  })

  it('reaches the field and then the button with Tab, and nothing else', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.tab()
    expect(screen.getByRole('textbox', { name: 'בחר נושא לבדיחה' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: 'צור בדיחה' })).toHaveFocus()

    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })
})

describe('Document', () => {
  it('is Hebrew and right-to-left', () => {
    expect(indexHtml).toMatch(/<html lang="he" dir="rtl">/)
  })
})
