# QuickLocalize

> Free, open-source localization tool powered by LLMs. Upload your JSON files, provide context about your app, and get accurate context-aware translations.

## ✨ Features

- **Upload Localization Files** - Support for JSON format
- **Context-Aware Translation** - Provide context (game, B2B software, casual app) to ensure tone-appropriate translations
- **LLM-Powered** - Uses Cloudflare Workers AI for fast, intelligent translations
- **Multiple Languages** - Support for 100+ languages via Llama 3
- **Free Forever** - No API keys, no paid tiers, completely open source
- **Privacy-First** - Your files are processed on Cloudflare's edge network
- **Real-Time Preview** - See translations as they're generated

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Deployment**: Cloudflare Pages
- **Backend**: Cloudflare Workers
- **LLM**: Cloudflare Workers AI (Llama 3)
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier)
- Git

## 🛠️ Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/quicklocalize.git
cd quicklocalize
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CF_ACCOUNT_ID=your_cloudflare_account_id
NEXT_PUBLIC_CF_API_TOKEN=your_cloudflare_api_token
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app.

## 📦 Project Structure

```
quicklocalize/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities (file parsing, prompt building)
│   └── api/              # API routes (Cloudflare Workers)
├── public/               # Static assets
├── wrangler.toml         # Cloudflare Workers config
├── next.config.js        # Next.js config
├── tailwind.config.js    # Tailwind CSS config
└── README.md
```

## 🌍 How It Works

### User Flow

1. User uploads a JSON localization file
2. User provides app context (e.g., "Casual mobile game", "Enterprise B2B solution")
3. User selects target language(s)
4. System processes the file with context in the prompt
5. LLM (Llama 3) generates context-aware translations
6. User downloads translated file(s)

### Behind the Scenes

```
User Upload → Next.js Handler → Cloudflare Worker
→ Workers AI (Llama 3) → Translate with Context
→ Return Result → User Download
```

## 🧠 Context Examples

The context helps the LLM choose appropriate tone and terminology:

```json
{
  "context": "This is a casual mobile puzzle game for kids aged 6-10",
  "file": { "greeting": "Hello Player!" },
  "targetLanguage": "Spanish"
}
// Output: "¡Hola Jugador!" (friendly, playful)
```

vs.

```json
{
  "context": "This is enterprise HR management software for Fortune 500 companies",
  "file": { "greeting": "Hello User" },
  "targetLanguage": "Spanish"
}
// Output: "Buenos días Usuario" (formal, professional)
```

## 🚀 Deployment to Cloudflare

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Deploy

```bash
npm run deploy
```

Your app will be live on `quicklocalize.pages.dev`

### 4. Custom Domain (Optional)

Configure in your Cloudflare dashboard under Pages → Custom Domain

## 💰 Costs

**At typical usage:**

- Pages: FREE (100,000 requests/day)
- Workers: FREE tier up to 100,000 requests/day
- Workers AI: ~$0.011 per 1,000 Neurons (usually $0-5/month for small projects)

**Your first 50,000 API calls are free. After that, scale at your own pace.**

## 📝 API Endpoint

### POST `/api/translate`

**Request:**

```json
{
  "file": {
    "greeting": "Hello",
    "goodbye": "Goodbye",
    "welcome": "Welcome to our app"
  },
  "context": "This is a casual mobile game",
  "targetLanguage": "Spanish",
  "fileFormat": "json"
}
```

**Response:**

```json
{
  "success": true,
  "translated": {
    "greeting": "¡Hola!",
    "goodbye": "¡Adiós!",
    "welcome": "Bienvenido a nuestra aplicación"
  }
}
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write clean, readable code
- Add comments for complex logic
- Test your changes locally before submitting a PR
- Follow existing code style (use Prettier/ESLint)

## 🐛 Issues & Bug Reports

Found a bug? Please open an issue on GitHub with:

- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, browser, Node version)

## 🗺️ Roadmap

- [x] Basic file upload functionality
- [x] JSON support
- [x] Progress tracking
- [ ] Bring Your Own API Key (use your own credentials for LLM access to improve results and unlock higher rate limits)
- [ ] YAML support
- [ ] Bulk file processing
- [ ] Translation memory & consistency checking
- [ ] Glossary support (maintain terminology)
- [ ] Advanced context prompts (brand voice, style guide)
- [ ] Multi-file batch operations
- [ ] Translation quality metrics
- [ ] Integration with version control systems
- [ ] Web UI improvements & localization of QuickLocalize itself

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) for providing free LLM inference
- [Meta](https://www.meta.com/) for Llama 3
- The open-source community for inspiration and support

## 📧 Contact

Have questions? Open an issue or reach out to the maintainers.

---

**Made with ❤️ for developers and creators worldwide**
