"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, TrendingDown, DollarSign, Target, Calendar } from "lucide-react"

interface StockAnalysis {
  stock: string
  currentPrice: number
  previousPrice: number
  highestToday: number
  trend: string
  suggestion: string
  average7DayClose: string
  idealBuyBelowPrice: number
  estimatedTargetPrice: number
  message: string
  aiAnalysis?: string
}

export default function StockAnalyzer() {
  const [stockSymbol, setStockSymbol] = useState("")
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const analyzeStock = async () => {
    if (!stockSymbol.trim()) {
      setError("Please enter a stock symbol")
      return
    }

    setLoading(true)
    setError("")
    setAnalysis(null)

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentName: "stockAdvisor",
          userPrompt: "Provide detailed stock analysis with market insights",
          stockSymbol: stockSymbol.toUpperCase(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze stock")
      }

      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      analyzeStock()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">📈 Stock Market Advisor</h1>
          <p className="text-gray-600">Get AI-powered stock analysis and recommendations</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Analysis</CardTitle>
            <CardDescription>Enter a stock symbol to get detailed analysis and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter stock symbol (e.g., TATAPOWER.BSE, AAPL)"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={analyzeStock} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {analysis && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Price Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Current Price</p>
                    <p className="text-2xl font-bold">₹{analysis.currentPrice}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Previous Close</p>
                    <p className="text-xl">₹{analysis.previousPrice}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Today's High</p>
                    <p className="text-xl">₹{analysis.highestToday}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">7-Day Average</p>
                    <p className="text-xl">₹{analysis.average7DayClose}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {analysis.trend.includes("uptrend") ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <Badge
                    variant={analysis.trend.includes("uptrend") ? "default" : "destructive"}
                    className="capitalize"
                  >
                    {analysis.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Suggestion:</span>
                    <Badge variant={analysis.suggestion === "Buy" ? "default" : "secondary"}>
                      {analysis.suggestion}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ideal Buy Below:</span>
                      <span className="font-semibold text-green-600">₹{analysis.idealBuyBelowPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Target Price:</span>
                      <span className="font-semibold text-blue-600">₹{analysis.estimatedTargetPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{analysis.message}</p>
                </div>
              </CardContent>
            </Card>

            {analysis.aiAnalysis && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    AI Market Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{analysis.aiAnalysis}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
