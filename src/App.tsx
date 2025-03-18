import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link2, Loader2, NewspaperIcon, AlertCircle, Clock, Globe2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Language options with their codes
const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

function App() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [language, setLanguage] = useState('auto');
  const [detectedLanguage, setDetectedLanguage] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setTimer(0);
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const formatTime = (seconds: number) => {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  const getLanguageName = (code: string) => {
    const lang = languages.find(l => l.code === code);
    return lang ? lang.name : code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    setSummary('');
    setError('');
    setDetectedLanguage('');

    try {
      // First, extract the article to detect its language
      const extractResponse = await axios.get('https://article-extractor-and-summarizer.p.rapidapi.com/extract', {
        params: { url },
        headers: {
          'X-RapidAPI-Key': 'a3247c6957msh1b3ed015d5d6129p130ddfjsn0ce89eb58c9f',
          'X-RapidAPI-Host': 'article-extractor-and-summarizer.p.rapidapi.com'
        }
      });

      if (!extractResponse.data.language) {
        throw new Error('Could not detect the article language');
      }

      const articleLanguage = extractResponse.data.language;
      setDetectedLanguage(articleLanguage);

      // Now get the summary using the detected language
      const summaryResponse = await axios.get('https://article-extractor-and-summarizer.p.rapidapi.com/summarize', {
        params: {
          url,
          length: '3',
          lang: language === 'auto' ? articleLanguage : language
        },
        headers: {
          'X-RapidAPI-Key': 'a3247c6957msh1b3ed015d5d6129p130ddfjsn0ce89eb58c9f',
          'X-RapidAPI-Host': 'article-extractor-and-summarizer.p.rapidapi.com'
        }
      });

      if (summaryResponse.data.summary) {
        setSummary(summaryResponse.data.summary);
        toast.success('Summary generated successfully!');
      } else {
        throw new Error('No summary was generated. The article might not be accessible or supported.');
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'An unexpected error occurred';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          errorMessage = 'The summarization service is temporarily unavailable. Please try again in a few moments.';
        } else if (error.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (error.response?.status === 401) {
          errorMessage = 'API authentication failed. Please check your API key.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <NewspaperIcon className="w-10 h-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Web Page Summarizer
          </h1>
          <p className="text-gray-600">
            Enter any article URL and get an AI-powered summary in seconds
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your article URL here"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe2 className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                >
                  <option value="auto">Auto-detect language</option>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  'Summarize'
                )}
              </button>
            </div>
          </div>
        </form>

        {loading && (
          <div className="mb-8 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-500" />
            <p className="text-purple-700">
              Processing time: {formatTime(timer)}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 mb-1">Error occurred</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {detectedLanguage && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Globe2 className="w-5 h-5 text-blue-500" />
            <p className="text-blue-700">
              Detected language: <span className="font-semibold">{getLanguageName(detectedLanguage)}</span>
            </p>
          </div>
        )}

        {summary && (
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Summary</h2>
            <p className="text-gray-600 leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;