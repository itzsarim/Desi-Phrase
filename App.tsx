import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Team, TeamId, Category } from './types';
import { TEAMS_INITIAL, CATEGORIES, TIMER_MIN_DURATION, TIMER_MAX_DURATION, WINNING_SCORE_DEFAULT } from './constants';
import { fetchWordsForCategory } from './services/geminiService';
import { audioService } from './services/audioService';
import { Button } from './components/Button';
import { Settings, Volume2, VolumeX, Trophy, Play, SkipForward, ArrowRight, RefreshCw, X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [teams, setTeams] = useState<Team[]>(TEAMS_INITIAL);
  const [winningScore, setWinningScore] = useState<number>(WINNING_SCORE_DEFAULT);
  
  // Round State
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentTeamIndex, setCurrentTeamIndex] = useState<number>(0); // Tracks who STARTS the round
  
  // Round Result State
  const [buzzerTeamId, setBuzzerTeamId] = useState<TeamId | null>(null);
  const [roundWinner, setRoundWinner] = useState<Team | null>(null);
  const [roundReason, setRoundReason] = useState<string>("");

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  
  // Refs for loop management
  const timerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  
  // Audio State
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // --- Audio Helpers ---
  const toggleMute = () => {
    const muted = audioService.toggleMute();
    setIsMuted(muted);
  };

  // --- Game Logic Helpers ---
  
  const startNewGame = () => {
    setTeams(teams.map(t => ({ ...t, score: 0 })));
    setGameState(GameState.CATEGORY_SELECT);
    setCurrentTeamIndex(0);
  };

  const selectCategory = async (category: Category) => {
    setCurrentCategory(category);
    setGameState(GameState.LOADING_WORDS);
    
    // Fetch words
    const fetchedWords = await fetchWordsForCategory(category.geminiPrompt);
    setWords(fetchedWords);
    setCurrentWordIndex(0);
    
    setGameState(GameState.PLAYING);
    startRound();
  };

  const startRound = () => {
    // Random duration between MIN and MAX
    const duration = Math.floor(Math.random() * (TIMER_MAX_DURATION - TIMER_MIN_DURATION + 1)) + TIMER_MIN_DURATION;
    setTotalTime(duration);
    setTimeLeft(duration);
    setIsTimerRunning(true);
    audioService.playBeep(880, 0.2); // Start sound
  };

  const nextWord = () => {
    // Standard next word
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
    // Loop logic removed to ensure no repeats in the round
  };

  const handleNextPoint = () => {
     if (currentWordIndex < words.length - 1) {
       nextWord();
       audioService.playBeep(600, 0.05); // Subtle click
     }
  };

  const endRound = useCallback(() => {
    setIsTimerRunning(false);
    audioService.playBuzzer();
    setBuzzerTeamId(null); // Reset selection
    setGameState(GameState.ROUND_OVER);
  }, []);

  const resolveRound = (didGuess: boolean) => {
    if (!buzzerTeamId) return;

    const teamWithDevice = teams.find(t => t.id === buzzerTeamId)!;
    const otherTeam = teams.find(t => t.id !== buzzerTeamId)!;
    
    let winner: Team;
    let reason: string;
    let nextStartingTeamIndex: number;

    if (didGuess) {
        // Team with device guessed it at the buzzer.
        // They win the point.
        winner = teamWithDevice;
        reason = `${teamWithDevice.name} guessed the phrase just in time!`;
        // Loser (Other Team) starts next round.
        nextStartingTeamIndex = teams.findIndex(t => t.id === otherTeam.id);
    } else {
        // Team with device got caught.
        // Other team wins point.
        winner = otherTeam;
        reason = `${teamWithDevice.name} got caught with the device!`;
        // Loser (Team With Device) starts next round.
        nextStartingTeamIndex = teams.findIndex(t => t.id === teamWithDevice.id);
    }

    // Update Scores
    const newTeams = teams.map(t => {
        if (t.id === winner.id) {
            return { ...t, score: t.score + 1 };
        }
        return t;
    });

    setTeams(newTeams);
    setRoundWinner(newTeams.find(t => t.id === winner.id) || winner);
    setRoundReason(reason);
    setCurrentTeamIndex(nextStartingTeamIndex);
    
    setGameState(GameState.ROUND_SUMMARY);
  };

  const continueAfterSummary = () => {
     if (!roundWinner) return;

     // Check Win Condition
     if (roundWinner.score >= winningScore) {
        audioService.playWin();
        setGameState(GameState.GAME_OVER);
      } else {
        setGameState(GameState.CATEGORY_SELECT);
      }
  };

  // --- Timer Effect ---
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft(prev => prev - 0.1); // Update every 100ms for smoothness
      }, 100);
    } else if (isTimerRunning && timeLeft <= 0) {
      endRound();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timeLeft, endRound]);

  // --- Audio Ticking Effect ---
  useEffect(() => {
    if (!isTimerRunning) {
      if (tickRef.current) clearTimeout(tickRef.current);
      return;
    }

    // Calculate tick interval based on % of time left.
    const percentageLeft = timeLeft / totalTime;
    let tickInterval = 2000; // default slow
    
    if (percentageLeft < 0.15) tickInterval = 300; // Panic mode
    else if (percentageLeft < 0.3) tickInterval = 600;
    else if (percentageLeft < 0.6) tickInterval = 1000;

    const scheduleTick = () => {
      if (percentageLeft < 0.15) audioService.playUrgentTick();
      else audioService.playTick();

      tickRef.current = window.setTimeout(scheduleTick, tickInterval);
    };

    scheduleTick();

    return () => {
       if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [isTimerRunning, totalTime, timeLeft]);


  // --- Render Functions ---

  const renderSetup = () => (
    <div className="flex flex-col h-full items-center justify-center p-6 space-y-8 animate-fade-in max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 drop-shadow-sm">
          Desi Phrase
        </h1>
        <p className="text-gray-600 font-medium">The Ultimate Indian Party Game</p>
      </div>

      <div className="w-full space-y-4 bg-white p-6 rounded-3xl shadow-xl border border-orange-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings size={20} className="text-orange-500"/> Game Setup
        </h2>
        
        {teams.map((team, idx) => (
          <div key={team.id} className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Team {idx + 1}</label>
            <input
              type="text"
              value={team.name}
              onChange={(e) => {
                const newTeams = [...teams];
                newTeams[idx].name = e.target.value;
                setTeams(newTeams);
              }}
              className={`w-full p-3 rounded-xl border-2 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all
                ${idx === 0 ? 'border-orange-200 focus:border-orange-500 focus:ring-orange-200 text-orange-800 bg-orange-50' : 
                              'border-green-200 focus:border-green-500 focus:ring-green-200 text-green-800 bg-green-50'}`}
            />
          </div>
        ))}

        <div className="pt-2">
             <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Points to Win: {winningScore}</label>
             <input 
                type="range" 
                min="3" 
                max="15" 
                value={winningScore} 
                onChange={(e) => setWinningScore(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-2"
             />
             <div className="flex justify-between text-xs text-gray-400 mt-1">
                 <span>3</span>
                 <span>15</span>
             </div>
        </div>
      </div>

      <Button fullWidth onClick={startNewGame} className="animate-bounce-subtle">
        Start Game <Play size={20} className="inline ml-2 fill-current" />
      </Button>
    </div>
  );

  const renderCategorySelect = () => (
    <div className="flex flex-col h-full p-6 animate-fade-in max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Current Score</span>
            <div className="flex gap-4 items-baseline">
                <span className="text-orange-600 font-bold">{teams[0].name}: {teams[0].score}</span>
                <span className="text-gray-300">|</span>
                <span className="text-green-600 font-bold">{teams[1].name}: {teams[1].score}</span>
            </div>
          </div>
          <button onClick={toggleMute} className="p-2 rounded-full bg-white shadow-md text-gray-600">
             {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
          </button>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          <span className={`${teams[currentTeamIndex].color}`}>{teams[currentTeamIndex].name}</span>
          <br/>
          <span className="text-lg font-normal text-gray-600">Pick a Category</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto pb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => selectCategory(cat)}
            className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-orange-400 hover:shadow-md transition-all aspect-square group"
          >
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="font-bold text-gray-800 text-sm">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col h-full items-center justify-center p-6 space-y-6 animate-fade-in">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {currentCategory?.icon}
            </div>
        </div>
        <h2 className="text-xl font-bold text-gray-700 text-center">
            Generating {currentCategory?.name} words...
        </h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
            Using AI to find the best words for you.
        </p>
    </div>
  );

  const renderPlaying = () => {
    // Determine screen background based on urgency
    const percentageLeft = timeLeft / totalTime;
    let bgClass = "bg-[#FFF5E1]";
    if (percentageLeft < 0.15) bgClass = "bg-red-50";

    return (
      <div className={`flex flex-col h-full p-6 ${bgClass} transition-colors duration-500 relative overflow-hidden`}>
        {/* Background Pulse for urgency */}
        {percentageLeft < 0.15 && (
            <div className="absolute inset-0 bg-red-200 opacity-20 animate-pulse pointer-events-none"></div>
        )}

        {/* Top Bar */}
        <div className="relative z-10 flex justify-between items-center mb-4">
           {/* Removed Team Turn Indicator */}
           <div className="px-3 py-1 bg-white/50 backdrop-blur rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider">
             Desi Phrase
           </div>
           <div className="font-mono font-bold text-gray-400">
               {currentCategory?.name}
           </div>
        </div>

        {/* Card Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
           <div className="w-full aspect-[4/5] max-h-[400px] bg-white rounded-3xl shadow-2xl flex items-center justify-center p-8 text-center border-4 border-gray-50 transform transition-all duration-300 hover:scale-[1.02]">
                <span className="text-4xl md:text-5xl font-black text-gray-800 break-words leading-tight">
                    {words[currentWordIndex]}
                </span>
           </div>
           
           {/* Visual Timer Bar Removed - Only Audio Cues */}
        </div>

        {/* Controls */}
        <div className="relative z-10 mt-8 space-y-3">
            <Button fullWidth onClick={handleNextPoint} className="h-20 text-2xl uppercase tracking-widest bg-gradient-to-r from-orange-500 to-pink-600">
                Next <ArrowRight className="inline ml-2" size={28}/>
            </Button>
        </div>
      </div>
    );
  };

  const renderRoundOver = () => {
    const buzzerTeam = teams.find(t => t.id === buzzerTeamId);

    return (
      <div className="flex flex-col h-full items-center justify-center p-6 space-y-6 animate-fade-in bg-red-50 text-center">
        <div className="p-4 bg-red-100 rounded-full text-red-500 mb-2 animate-bounce">
            <AlertTriangle size={48} />
        </div>
        
        <h2 className="text-4xl font-black text-red-600 uppercase tracking-tighter">Time's Up!</h2>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full max-w-sm">
            <p className="text-sm text-gray-500 uppercase font-bold mb-1">Last Word</p>
            <p className="text-xl font-bold text-gray-800">{words[currentWordIndex]}</p>
        </div>

        <div className="w-full max-w-sm space-y-4 pt-4">
             {/* Step 1: Select Team */}
             {!buzzerTeamId && (
                <>
                    <p className="text-sm font-semibold text-gray-500 flex items-center justify-center gap-2">
                        <HelpCircle size={16}/> Who was guessing at the buzzer?
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        {teams.map(t => (
                            <button 
                                key={t.id}
                                onClick={() => setBuzzerTeamId(t.id)}
                                className={`p-4 rounded-xl border-2 font-bold shadow-md transition-all active:scale-95 flex flex-col items-center gap-2
                                    ${t.id === TeamId.A ? 'bg-orange-50 border-orange-200 text-orange-700 hover:border-orange-500' : 'bg-green-50 border-green-200 text-green-700 hover:border-green-500'}
                                `}
                            >
                                <span className="text-2xl">🤔</span>
                                {t.name}
                            </button>
                        ))}
                    </div>
                </>
             )}

             {/* Step 2: Select Outcome */}
             {buzzerTeamId && buzzerTeam && (
                 <div className="space-y-4 animate-fade-in">
                    <p className="text-lg text-gray-700">
                        Did <span className={`font-bold ${buzzerTeam.color}`}>{buzzerTeam.name}</span> guess it?
                    </p>
                    
                    <div className="space-y-3">
                        <Button variant="danger" fullWidth onClick={() => resolveRound(false)}>
                           <X className="inline mr-2" size={20}/> No, Got Caught
                        </Button>
                        <Button variant="secondary" fullWidth onClick={() => resolveRound(true)} className="border-green-200 hover:border-green-500 text-green-700">
                           <CheckCircle className="inline mr-2" size={20}/> Yes, Just in Time!
                        </Button>
                    </div>
                    
                    <button 
                        onClick={() => setBuzzerTeamId(null)}
                        className="text-xs text-gray-400 underline mt-4 hover:text-gray-600"
                    >
                        Change Team
                    </button>
                 </div>
             )}
        </div>
      </div>
    );
  };

  const renderRoundSummary = () => (
    <div className="flex flex-col h-full items-center justify-center p-6 space-y-8 animate-fade-in bg-[#FFF5E1]">
        <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">Round Result</h2>
            <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full"></div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border-2 border-orange-50 space-y-4">
             <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Point goes to</p>
                <div className={`text-3xl font-black ${roundWinner?.color} mb-1`}>
                    {roundWinner?.name}
                </div>
                <div className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-md font-bold">
                    +1 Point
                </div>
             </div>
             
             <div className="bg-gray-50 p-4 rounded-xl flex items-start gap-3 text-left">
                 <Info className="flex-shrink-0 text-blue-400 mt-0.5" size={18} />
                 <p className="text-sm text-gray-600 leading-snug">
                    {roundReason}
                 </p>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                 {teams.map(t => (
                     <div key={t.id} className="text-center">
                         <span className="text-xs text-gray-400 uppercase font-bold block">{t.name}</span>
                         <span className={`text-2xl font-bold ${t.id === roundWinner?.id ? t.color : 'text-gray-300'}`}>
                             {t.score}
                         </span>
                     </div>
                 ))}
             </div>
        </div>

        <Button onClick={continueAfterSummary} fullWidth className="max-w-sm">
            Next Round <ArrowRight className="inline ml-2" size={20}/>
        </Button>
    </div>
  );

  const renderGameOver = () => {
    // Find winner
    const winner = teams.reduce((prev, current) => (prev.score > current.score) ? prev : current);

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 space-y-8 animate-fade-in text-center">
             <div className="text-6xl animate-bounce">🏆</div>
             
             <div>
                 <h1 className="text-5xl font-black text-gray-800 mb-2">Winner!</h1>
                 <h2 className={`text-3xl font-bold ${winner.color}`}>{winner.name}</h2>
             </div>

             <div className="flex gap-8 items-end justify-center w-full max-w-sm">
                 {teams.map((t, i) => (
                     <div key={i} className="flex flex-col items-center gap-2">
                         <div className={`w-16 rounded-t-lg transition-all duration-1000 ease-out ${t.id === winner.id ? 'h-32 bg-yellow-400' : 'h-16 bg-gray-200'}`}></div>
                         <span className="font-bold text-gray-700">{t.score}</span>
                         <span className="text-xs text-gray-500 uppercase">{t.name}</span>
                     </div>
                 ))}
             </div>

             <Button onClick={startNewGame} fullWidth>
                Play Again <RefreshCw className="inline ml-2" size={18}/>
             </Button>
        </div>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FFF5E1] text-gray-800">
      {gameState === GameState.SETUP && renderSetup()}
      {gameState === GameState.CATEGORY_SELECT && renderCategorySelect()}
      {gameState === GameState.LOADING_WORDS && renderLoading()}
      {gameState === GameState.PLAYING && renderPlaying()}
      {gameState === GameState.ROUND_OVER && renderRoundOver()}
      {gameState === GameState.ROUND_SUMMARY && renderRoundSummary()}
      {gameState === GameState.GAME_OVER && renderGameOver()}
    </div>
  );
}