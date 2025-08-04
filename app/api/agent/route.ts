import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY

interface StockData {
  [date: string]: {
    "1. open": string
    "2. high": string
    "3. low": string
    "4. close": string
    "5. volume": string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agentName, userPrompt, stockSymbol } = await request.json()

    if (agentName !== "stockAdvisor" || !userPrompt || !stockSymbol) {
      return NextResponse.json(
        {
          error: 'Invalid input. Provide agentName="stockAdvisor", stockSymbol, and userPrompt.',
        },
        { status: 400 },
      )
    }

    if (!ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json({ error: "Alpha Vantage API key not configured" }, { status: 500 })
    }

    // Fetch stock data from Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    const response = await fetch(url)
    const stockResponse = await response.json()

    const data: StockData = stockResponse["Time Series (Daily)"]

    if (!data) {
      return NextResponse.json(
        { error: "Stock data not found for the symbol. Please check the symbol and try again." },
        { status: 404 },
      )
    }

    // Process stock data
    const dates = Object.keys(data).sort().reverse()
    const latest = data[dates[0]]
    const previous = data[dates[1]]

    const latestClose = Number.parseFloat(latest["4. close"])
    const previousClose = Number.parseFloat(previous["4. close"])
    const trend = latestClose > previousClose ? "uptrend 📈" : "downtrend 📉"
    const suggestion = latestClose > previousClose ? "Buy" : "Wait or Sell"

    const last7Closes = dates.slice(0, 7).map((date) => Number.parseFloat(data[date]["4. close"]))
    const average7DayClose = last7Closes.reduce((a, b) => a + b, 0) / last7Closes.length
    const estimatedTargetPrice = Number.parseFloat((average7DayClose * 1.02).toFixed(2))
    const idealBuyBelowPrice = Number.parseFloat((average7DayClose * 0.98).toFixed(2))
    const highestPriceToday = Number.parseFloat(latest["2. high"])

    // Generate AI analysis using Groq
    let aiAnalysis = ""
    try {
      const { text } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt: `Analyze the stock ${stockSymbol} with the following data:
        - Current Price: ₹${latestClose}
        - Previous Close: ₹${previousClose}
        - 7-day Average: ₹${average7DayClose.toFixed(2)}
        - Trend: ${trend}
        - Today's High: ₹${highestPriceToday}
        
        Provide a detailed market analysis including:
        1. Technical analysis of the price movement
        2. Market sentiment and factors that might be affecting the stock
        3. Risk assessment
        4. Investment recommendations for different investor types (short-term vs long-term)
        
        Keep the analysis professional and informative, around 200-300 words.`,
      })
      aiAnalysis = text
    } catch (aiError) {
      console.error("AI analysis failed:", aiError)
      // Continue without AI analysis if it fails
    }

    const result = {
      stock: stockSymbol,
      currentPrice: latestClose,
      previousPrice: previousClose,
      highestToday: highestPriceToday,
      trend,
      suggestion,
      average7DayClose: average7DayClose.toFixed(2),
      idealBuyBelowPrice,
      estimatedTargetPrice,
      message: `Stock ${stockSymbol} is in ${trend}. Recommendation: ${suggestion}. Ideal Buy Below: ₹${idealBuyBelowPrice}, Target: ₹${estimatedTargetPrice}, Today's High: ₹${highestPriceToday}`,
      aiAnalysis,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch stock data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
