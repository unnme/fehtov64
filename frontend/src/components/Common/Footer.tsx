import { FaTelegram } from "react-icons/fa"

// Footer component with copyright and social links
export function Footer() {
  const currentYear = new Date().getFullYear()
  // Replace with your Telegram profile URL
  const telegramUrl = "https://t.me/your_username"

  return (
    <footer className="border-t py-4 px-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-muted-foreground text-sm">
          Full Stack FastAPI Template - {currentYear}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <FaTelegram className="h-6 w-6" />
          </a>
        </div>
      </div>
    </footer>
  )
}
