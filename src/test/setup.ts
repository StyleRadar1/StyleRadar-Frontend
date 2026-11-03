import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  localStorage.clear()
})

// jsdom no implementa URL.createObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:prueba'
  URL.revokeObjectURL = () => {}
}

// jsdom no implementa scrollIntoView
Element.prototype.scrollIntoView ??= function scrollIntoView() {}
