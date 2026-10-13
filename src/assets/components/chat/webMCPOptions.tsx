"use client";

import { useRegisterWebMCPTools } from '@tanstack/ai-react'
import { webMCPTools } from './openHelpPanel'

const webMCPOptions = {
  onError(error: unknown) {
    console.error('WebMCP registration failed', error)
  },
}

export function HelpPage() {
  useRegisterWebMCPTools(webMCPTools, webMCPOptions)

  return (
    <section id="help-panel" popover="auto">
      <h2>Help</h2>
    </section>
  )
}
