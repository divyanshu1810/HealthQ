"use client"
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Mic, Square, Volume2, VolumeX, Globe, Check } from 'lucide-react';
import { useRouter, useSearchParams } from "next/navigation";

// Language options for manual selection
const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ar-SA', name: 'Arabic' }
];

export default function ChatApp() {
  const documentId = useSearchParams().get("documentId") || "defaultDocumentId";
  console.log("Document ID:", documentId);

  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [messages, setMessages] = useState<{ sender: string; text: string; isLoading?: boolean }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [typingIndex, setTypingIndex] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Text to speech states
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentlySpeakingMessageId, setCurrentlySpeakingMessageId] = useState<number | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Speech recognition states
  const [listening, setListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isBrowserSupportAvailable, setIsBrowserSupportAvailable] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);
  
  // Language selection states
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [autoDetect, setAutoDetect] = useState<boolean>(true);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Check if speech synthesis is available
      if (!synthRef.current) {
        console.warn("Text-to-speech is not supported in this browser");
      }
      
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('Speech recognition not supported in this browser');
        setIsBrowserSupportAvailable(false);
        return;
      } else {
        setIsBrowserSupportAvailable(true);
      }
      
      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      if (autoDetect) {
        // For auto-detection, we don't set a specific language
        recognitionRef.current.lang = '';
      } else {
        recognitionRef.current.lang = selectedLanguage.code;
      }
      
      // Handle result event
      recognitionRef.current.onresult = (event) => {
        const transcriptResult = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setTranscript(transcriptResult);
        setQuestion(transcriptResult);
      };
      
      // Handle end event
      recognitionRef.current.onend = () => {
        setListening(false);
      };
      
      // Handle error event
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setListening(false);
      };
    }
    
    // Cleanup function
    return () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        if (listening) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.error("Error stopping recognition:", e);
          }
        }
      }
    };
  }, [selectedLanguage, autoDetect]);

  // Add event listener for clicks outside language menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle speech recognition
  const toggleListening = () => {
    if (!isBrowserSupportAvailable) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (listening) {
      try {
        recognitionRef.current.stop();
        setListening(false);
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    } else {
      setTranscript('');
      
      // Update language setting before starting
      if (autoDetect) {
        recognitionRef.current.lang = ''; // Auto-detect
      } else {
        recognitionRef.current.lang = selectedLanguage.code;
      }
      
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  };

  // Handle language selection
  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setAutoDetect(false);
    setIsLanguageMenuOpen(false);
    
    // Update recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = language.code;
      
      // Restart recognition if already listening
      if (listening) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.start();
        } catch (e) {
          console.error("Error restarting recognition:", e);
        }
      }
    }
  };

  // Enable auto detection
  const enableAutoDetect = () => {
    setAutoDetect(true);
    setIsLanguageMenuOpen(false);
    
    // Update recognition to auto-detect
    if (recognitionRef.current) {
      recognitionRef.current.lang = '';
      
      // Restart recognition if already listening
      if (listening) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.start();
        } catch (e) {
          console.error("Error restarting recognition:", e);
        }
      }
    }
  };

  const speakText = (text: string, messageId: number) => {
    if (!synthRef.current) {
      console.warn('Text-to-speech is not supported in your browser.');
      return;
    }
    
    try {
      // First, cancel any ongoing speech
      if (synthRef.current.speaking) {
        synthRef.current.cancel();
        setIsSpeaking(false);
        setCurrentlySpeakingMessageId(null);
        
        // If clicking on already speaking message, just stop it
        if (currentlySpeakingMessageId === messageId) {
          return;
        }
      }
      
      // Create a new utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;
      
      // Configure the utterance
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Set up event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentlySpeakingMessageId(messageId);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingMessageId(null);
        utteranceRef.current = null;
      };
      
      utterance.onerror = (event) => {
        // console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setCurrentlySpeakingMessageId(null);
        utteranceRef.current = null;
      };
      
      // Speak the text
      synthRef.current.speak(utterance);
    } catch (error) {
      // console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
      setCurrentlySpeakingMessageId(null);
    }
  };
  
  const stopSpeaking = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setCurrentlySpeakingMessageId(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    
    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("File uploaded successfully");
    } catch (error) {
      console.error("Upload error", error);
      alert("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  // Loading messages to display while waiting for AI response
  const loadingMessages = [
    "Analyzing the document...",
    "Processing your question...",
    "Searching for relevant information...",
    "Generating a response...",
    "Almost there...",
  ];

  // Typing animation for loading message
  useEffect(() => {
    let typingInterval: NodeJS.Timeout;
    
    const updateTypingIndex = () => {
      setTypingIndex(prev => (prev + 1) % loadingMessages.length);
    };
    
    if (loading) {
      typingInterval = setInterval(updateTypingIndex, 3000);
    }
    
    return () => {
      if (typingInterval) clearInterval(typingInterval);
    };
  }, [loading, loadingMessages.length]);

  const handleAsk = async () => {
    if (!documentId || !question.trim()) {
      alert("Please provide both document ID and question");
      return;
    }
    
    const userQuestion = question;
    setLoading(true);
    
    // Add user message immediately
    setMessages((prev) => [...prev, { sender: "User", text: userQuestion }]);
    
    // Add AI loading message
    setMessages((prev) => [...prev, { sender: "AI", text: loadingMessages[0], isLoading: true }]);
    
    setQuestion(""); // Clear input field immediately after sending
    setTranscript(""); // Also reset the transcript
    
    try {
      const res = await axios.post("http://localhost:5000/ask", { 
        documentId, 
        question: userQuestion 
      });
      
      // Remove loading message and add actual response
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isLoading);
        return [...newMessages, { sender: "AI", text: res.data.answer }];
      });
      
      // Automatically speak the AI response after a short delay
      setTimeout(() => {
        speakText(res.data.answer, messages.length);
      }, 500);
      
    } catch (error) {
      console.error("Ask error", error);
      
      // Remove loading message and add error message
      setMessages(prev => {
        const newMessages = prev.filter(msg => !msg.isLoading);
        return [...newMessages, { sender: "AI", text: "Sorry, I encountered an error while processing your request. Please try again." }];
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle enter key press to submit question
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto bg-white p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-black">HealthQ</h1>
          <div className="text-sm text-gray-600">
            {documentId !== "defaultDocumentId" && (
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                Document: {documentId.substring(0, 10)}...
              </span>
            )}
          </div>
        </header>
        
        {/* Messages container - takes up all available space */}
        <div className="flex-grow overflow-y-auto bg-white p-4 rounded-lg border-2 border-gray-700 flex flex-col my-4">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center mt-20">
              <p className="mb-2">No messages yet. Ask a question to get started!</p>
              <p className="text-sm">This chatbot can analyze your document and answer questions about it.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`p-2 my-2 rounded max-w-[75%] ${
                msg.sender === "User" 
                  ? "bg-white self-end border-2 border-black text-black text-right" 
                  : "self-start border-black border-2 text-black text-left flex items-start"
              }`}>
                <div className="flex-grow">
                  <strong>{msg.sender}:</strong> {msg.text}
                  
                  {/* Loading animation dots */}
                  {msg.isLoading && (
                    <span className="inline-block ml-1">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse animation-delay-200">.</span>
                      <span className="animate-pulse animation-delay-400">.</span>
                    </span>
                  )}
                </div>
                {msg.sender === "AI" && !msg.isLoading && (
                  <button 
                    onClick={() => currentlySpeakingMessageId === index ? stopSpeaking() : speakText(msg.text, index)}
                    className="ml-2 p-1 hover:bg-gray-200 rounded-full"
                    title={currentlySpeakingMessageId === index ? "Stop speaking" : "Speak message"}
                  >
                    {currentlySpeakingMessageId === index ? (
                      <VolumeX size={16} className="text-red-500" />
                    ) : (
                      <Volume2 size={16} className="text-black" />
                    )}
                  </button>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
        </div>
        
        {/* Input area */}
        <div className="py-4 border-t border-gray-200">
          <div className="flex w-full gap-2">
            <div className="relative flex-grow">
              <input 
                type="text" 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)} 
                onKeyDown={handleKeyPress}
                placeholder={listening ? "Listening..." : "Ask a question"} 
                className={`border-2 border-black bg-white text-black p-2 w-full rounded-lg pr-20 ${listening ? 'border-blue-500' : ''}`}
                disabled={loading}
              />
              
              {/* Language selection button */}
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2" ref={languageMenuRef}>
                <button
                  onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                  className="p-1 hover:bg-gray-200 rounded-full text-black"
                  title="Select language"
                  disabled={loading}
                >
                  <Globe size={18} />
                </button>
                
                {/* Language dropdown */}
                {isLanguageMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {/* Auto-detect option */}
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          autoDetect ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={enableAutoDetect}
                      >
                        <div className="flex items-center justify-between">
                          <span>Auto Detect</span>
                          {autoDetect && <Check size={16} className="text-gray-700" />}
                        </div>
                      </button>
                      
                      <div className="border-t border-gray-100"></div>
                      
                      {/* Language options */}
                      {LANGUAGES.map((language) => (
                        <button
                          key={language.code}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            !autoDetect && selectedLanguage.code === language.code
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handleLanguageSelect(language)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{language.name}</span>
                            {!autoDetect && selectedLanguage.code === language.code && (
                              <Check size={16} className="text-gray-700" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mic button */}
              <button
                onClick={toggleListening}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full ${listening ? 'text-red-500' : 'text-black'}`}
                title={listening ? "Stop listening" : "Start speech recognition"}
                disabled={loading}
              >
                {listening ? (
                  <Square size={18} className="text-red-500" />
                ) : (
                  <Mic size={18} className="text-black" />
                )}
              </button>
            </div>
            <button 
              onClick={handleAsk} 
              className={`bg-white border-2 border-black text-black font-semibold px-4 py-2 rounded-lg transition whitespace-nowrap ${
                loading || !question.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
              }`}
              disabled={loading || !question.trim()}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-t-2 border-black border-solid rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : "Ask"}
            </button>
          </div>
          
          {/* Language and status indicator */}
          {listening && (
            <div className="mt-2 text-sm text-gray-600">
              {autoDetect ? 'Listening (Auto-detecting language)...' : `Listening in ${selectedLanguage.name}...`}
            </div>
          )}
          
          {/* Browser support message */}
          {typeof window !== 'undefined' && !isBrowserSupportAvailable && (
            <div className="mt-2 text-sm text-red-600">
              Speech recognition is not supported in your browser.
            </div>
          )}
        </div>
      </div>

      {/* Add custom CSS for animation delays */}
      <style jsx global>{`
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
      `}</style>
    </div>
  );
}