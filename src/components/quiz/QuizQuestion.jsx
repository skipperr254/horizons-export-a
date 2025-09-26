import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Sparkles, Zap, Target, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const QuizQuestion = React.memo(({ 
  question, 
  selectedAnswer, 
  isAnswered, 
  onAnswerSelect, 
  timeLeft,
  streak,
  score,
  currentQuestionIndex,
  totalQuestions,
  onExit
}) => {
  const getButtonClass = (option) => {
    const isCorrect = option === question.correctAnswer;
    const isSelected = selectedAnswer === option;
    
    let baseClass = "h-[90px] sm:h-[100px] md:h-[120px] text-base sm:text-lg font-bold transition-all duration-300 relative overflow-hidden border-2 rounded-2xl shadow-lg flex items-center justify-center p-4 text-center w-full whitespace-normal text-wrap";
    
    if (isAnswered) {
      if (isCorrect) {
        return `${baseClass} bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400 shadow-2xl shadow-green-500/50 scale-105 ring-4 ring-white/50`;
      } else if (isSelected && !isCorrect) {
        return `${baseClass} bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-400 shadow-2xl shadow-red-500/50 scale-105 ring-4 ring-white/50`;
      } else {
        return `${baseClass} opacity-50 bg-muted border-muted-foreground/20`;
      }
    } else {
      return `${baseClass} bg-background/50 backdrop-blur-sm border-border hover:border-primary/70 hover:shadow-2xl hover:shadow-primary/20 hover:scale-102`;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
       <div className="w-full px-2">
            <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="w-full h-3 bg-primary/20" />
            <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                <button onClick={onExit} className="hover:text-primary transition-colors">
                    <X className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-1 font-bold text-primary">
                    <Timer className="h-5 w-5" />
                    <span>{timeLeft}</span>
                </div>
            </div>
        </div>

      <Card className="relative overflow-hidden border-0 shadow-2xl bg-transparent">
        <div className="absolute -inset-2 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 blur-xl opacity-50"></div>
        
        <div className="flex flex-col p-4 sm:p-6 lg:p-8 gap-4 sm:gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
            className="relative text-center"
          >
            <div className="relative bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white p-8 sm:p-12 md:p-16 rounded-3xl shadow-2xl shadow-primary/20 mx-auto max-w-4xl">
              <motion.span 
                className="text-2xl sm:text-3xl md:text-4xl font-black capitalize tracking-wide block"
                key={question.word}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {question.word}
              </motion.span>
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Soru {currentQuestionIndex + 1}/{totalQuestions}</span>
            </div>
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Seri: {streak}</span>
            </div>
            <div className="flex items-center gap-2 bg-background/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="font-medium">Puan: {score}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto w-full">
            {question.options.map((option, index) => (
              <motion.div
                key={`${question.word}-${option}-${index}`}
                initial={{ opacity: 0, y: 25, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 180, damping: 25 }}
                whileHover={!isAnswered ? { y: -5, scale: 1.03 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <Button
                  variant="outline"
                  className={getButtonClass(option)}
                  onClick={() => onAnswerSelect(option)}
                  disabled={isAnswered}
                >
                  <div className="relative z-10 flex items-center justify-center gap-x-2 sm:gap-x-4 w-full h-full">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg sm:text-xl">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="capitalize text-center flex-1 break-words leading-tight">{option}</span>
                  </div>
                  
                  {isAnswered && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {option === question.correctAnswer && <Check className="h-12 w-12 sm:h-16 sm:w-16 text-white/80" strokeWidth={3} />}
                      {selectedAnswer === option && option !== question.correctAnswer && <X className="h-12 w-12 sm:h-16 sm:w-16 text-white/80" strokeWidth={3} />}
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
});

export default QuizQuestion;