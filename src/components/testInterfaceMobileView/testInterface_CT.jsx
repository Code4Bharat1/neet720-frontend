"use client"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  FaFlask,
  FaAtom,
  FaDna,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaEraser,
  FaClock,
  FaBolt,
  FaFlag,
} from "react-icons/fa"
import { IoMdCheckmark, IoMdClose } from "react-icons/io"
import { MdFlag, MdVisibility } from "react-icons/md"
import { HiOutlineSparkles } from "react-icons/hi"
import { RiQuestionnaireFill } from "react-icons/ri"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

const subjectIcons = {
  Physics: {
    icon: FaAtom,
    color: "text-blue-600",
    bgColor: "bg-blue-500",
    gradientFrom: "from-blue-400",
    gradientTo: "to-blue-600",
  },
  Chemistry: {
    icon: FaFlask,
    color: "text-green-600",
    bgColor: "bg-green-500",
    gradientFrom: "from-green-400",
    gradientTo: "to-green-600",
  },
  Biology: {
    icon: FaDna,
    color: "text-red-600",
    bgColor: "bg-red-500",
    gradientFrom: "from-red-400",
    gradientTo: "to-red-600",
  },
}

const TestInterface = () => {
  // State management
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [selectedChapters, setSelectedChapters] = useState({})
  const [questionsData, setQuestionsData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentSubject, setCurrentSubject] = useState(() => {
    if (typeof window !== "undefined") {
      const storedSubjects = localStorage.getItem("selectedSubjects")
      if (storedSubjects) {
        try {
          const parsedSubjects = JSON.parse(storedSubjects)
          return parsedSubjects[0] || "Physics" // fallback to "Physics" if empty array
        } catch (error) {
          console.error("Failed to parse subjects from localStorage:", error)
        }
      }
    }
    return "Physics" // default if nothing found
  })
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [visitedQuestions, setVisitedQuestions] = useState({})
  const [markedForReview, setMarkedForReview] = useState({})
  const [timer, setTimer] = useState(0)
  const [startTime, setStartTime] = useState(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredOption, setHoveredOption] = useState(null)
  const [totalQuestions, setTotalQuestions] = useState(0)

  // Mobile Sheet/Modal state
  const [showNavGrid, setShowNavGrid] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Use ref to track if the timer has been initialized
  const timerInitialized = useRef(false)
  const intervalRef = useRef(null)
  const router = useRouter()

  // useEffect to control the escape screen
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement &&
        !document.mozFullScreenElement
      ) {
        router.push("/testselection")
      }
    }
    document.addEventListener("fullscreenchange", handleFullScreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange)
    document.addEventListener("mozfullscreenchange", handleFullScreenChange)
    document.addEventListener("MSFullscreenChange", handleFullScreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullScreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullScreenChange)
    }
  }, [router])

  // 1. INITIALIZATION EFFECT
  useEffect(() => {
    if (typeof window === "undefined") return // SSR

    const storedSelectedChapters = JSON.parse(localStorage.getItem("selectedChapters")) || {}
    setSelectedChapters(storedSelectedChapters)
    const storedSubjects = JSON.parse(localStorage.getItem("selectedSubjects")) || []
    setSelectedSubjects(storedSubjects)

    let totalQuestionsCount = 0
    storedSubjects.forEach((subject) => {
      const subjectChapters = storedSelectedChapters[subject]
      if (subjectChapters) {
        totalQuestionsCount += Object.values(subjectChapters).reduce(
          (total, chapter) => total + (Number(chapter.numQuestions) || 0),
          0,
        )
      }
    })
    setTotalQuestions(totalQuestionsCount)

    if (totalQuestionsCount > 0 && !timerInitialized.current) {
      setTimer(totalQuestionsCount * 60)
      timerInitialized.current = true
    }

    const fetchQuestions = async () => {
      try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/createtest/fetch-questions`, {
          selectedSubjects: storedSubjects,
          selectedChapters: storedSelectedChapters,
          numQuestions: totalQuestionsCount,
        })
        const data = response.data
        const subjectWiseQuestions = {
          Physics: [],
          Chemistry: [],
          Biology: [],
        }
        data.questions.forEach((item) => {
          const subject = item.question.subject
          subjectWiseQuestions[subject]?.push({
            id: item.question.id,
            question: item.question.question_text,
            options: item.options.map((opt) => opt.option_text),
            correctAnswer: item.correctAnswer ? item.correctAnswer.option_text : null,
          })
        })
        setQuestionsData(subjectWiseQuestions)
        setLoading(false)

        // Set initial subject to the first one with questions, if any
        if (storedSubjects.length > 0) {
          const firstSubjectWithQuestions = storedSubjects.find((subject) => subjectWiseQuestions[subject]?.length > 0)
          if (firstSubjectWithQuestions) {
            setCurrentSubject(firstSubjectWithQuestions)
          } else {
            setError("No questions available for the selected subjects/chapters.")
          }
        } else {
          setError("No subjects selected for the test.")
        }

        // Store chapter info
        const questionInfo = data.questions.map((item) => ({
          chapterId: item.question.chapterId,
          chapterName: item.question.chapter,
          questionIds: item.question.id,
        }))
        localStorage.setItem("questionInfo", JSON.stringify(questionInfo))
      } catch (err) {
        setError("Failed to load questions")
        setLoading(false)
      }
    }
    fetchQuestions()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Prevent reload on F5 or Ctrl+R
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // 2. TIMER EFFECT
  useEffect(() => {
    if (!timerInitialized.current) return
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(intervalRef.current)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerInitialized.current])

  // Calculate the actual number of questions for the current subject
  const currentSubjectActualQuestionCount = questionsData[currentSubject]?.length || 0

  const formattedTime = {
    hours: String(Math.floor(timer / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((timer % 3600) / 60)).padStart(2, "0"),
    seconds: String(timer % 60).padStart(2, "0"),
  }

  const handleOptionClick = (index) => {
    if (!questionsData[currentSubject] || !questionsData[currentSubject][currentQuestion]) return
    const questionData = questionsData[currentSubject][currentQuestion]
    const selectedAnswer = questionData.options[index]
    const correctAnswer = questionData.correctAnswer
    const isCorrect = selectedAnswer === correctAnswer

    const answerSnapshot = {
      question_id: questionData.id,
      selectedAnswer,
      correctAnswer,
    }
    localStorage.setItem("lastAnswerClicked", JSON.stringify(answerSnapshot))

    const questionId = questionData.id
    const questionInfo = JSON.parse(localStorage.getItem("questionInfo")) || []
    const chapterInfo = questionInfo.find((item) => item.questionIds === questionId)
    const chapterName = chapterInfo ? chapterInfo.chapterName : "Unknown Chapter"

    const answerData = {
      subject: currentSubject,
      question: questionData.question,
      question_id: questionData.id,
      chapterName,
      selectedAnswer,
      isCorrect,
      correctAnswer,
    }

    const savedAnswers = JSON.parse(localStorage.getItem("testAnswers")) || []
    const existingIndex = savedAnswers.findIndex(
      (answer) => answer.question_id === questionData.id && answer.subject === currentSubject,
    )

    const currentTime = new Date()
    const timeTakenInSeconds = (currentTime - startTime) / 1000
    const minutes = Math.floor(timeTakenInSeconds / 60)
    const seconds = Math.floor(timeTakenInSeconds % 60)
    const answerWithTime = { ...answerData, timeTaken: { minutes, seconds } }

    if (existingIndex >= 0) {
      savedAnswers[existingIndex] = answerWithTime
    } else {
      savedAnswers.push(answerWithTime)
    }
    localStorage.setItem("testAnswers", JSON.stringify(savedAnswers))

    setAnswers({ ...answers, [`${currentSubject}-${currentQuestion}`]: index })
    setVisitedQuestions({
      ...visitedQuestions,
      [`${currentSubject}-${currentQuestion}`]: true,
    })

    const previousTime = JSON.parse(localStorage.getItem("questionTime")) || {}
    previousTime[`${currentSubject}-${currentQuestion}`] = timeTakenInSeconds
    localStorage.setItem("questionTime", JSON.stringify(previousTime))

    const savedTimeForCurrentQuestion = previousTime[`${currentSubject}-${currentQuestion}`]
    const newStartTime = savedTimeForCurrentQuestion
      ? new Date(new Date() - savedTimeForCurrentQuestion * 1000)
      : currentTime
    setStartTime(newStartTime)
  }

  const handleNavigation = (direction) => {
    const totalQuestionsInCurrentSubject = currentSubjectActualQuestionCount

    if (direction === "next" && currentQuestion >= totalQuestionsInCurrentSubject - 1) {
      const currentSubjectIndex = selectedSubjects.indexOf(currentSubject)
      const nextSubjectIndex = (currentSubjectIndex + 1) % selectedSubjects.length
      setCurrentSubject(selectedSubjects[nextSubjectIndex])
      setCurrentQuestion(0)
    } else if (direction === "prev" && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    } else if (direction === "next" && currentQuestion < totalQuestionsInCurrentSubject - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else if (direction === "prev" && currentQuestion === 0) {
      const currentSubjectIndex = selectedSubjects.indexOf(currentSubject)
      if (currentSubjectIndex > 0) {
        const prevSubject = selectedSubjects[currentSubjectIndex - 1]
        setCurrentSubject(prevSubject)
        const prevSubjectActualQuestionCount = questionsData[prevSubject]?.length || 0
        setCurrentQuestion(Math.max(prevSubjectActualQuestionCount - 1, 0))
      }
    }
  }

  const handleReviewLater = () => {
    setMarkedForReview({
      ...markedForReview,
      [`${currentSubject}-${currentQuestion}`]: !markedForReview[`${currentSubject}-${currentQuestion}`],
    })
  }

  const handleClearResponse = () => {
    const updatedAnswers = { ...answers }
    delete updatedAnswers[`${currentSubject}-${currentQuestion}`]
    setAnswers(updatedAnswers)

    let savedAnswers = JSON.parse(localStorage.getItem("testAnswers")) || []
    savedAnswers = savedAnswers.filter(
      (answer) =>
        !(
          answer.question_id === questionsData[currentSubject][currentQuestion]?.id && answer.subject === currentSubject
        ),
    )
    localStorage.setItem("testAnswers", JSON.stringify(savedAnswers))
  }

  const calculateTotalTime = (subject) => {
    const questionTime = JSON.parse(localStorage.getItem("questionTime")) || {}
    let totalTimeInSeconds = 0
    Object.keys(questionTime).forEach((key) => {
      if (key.startsWith(subject)) {
        totalTimeInSeconds += questionTime[key]
      }
    })
    const minutes = Math.floor(totalTimeInSeconds / 60)
    const seconds = Math.floor(totalTimeInSeconds % 60)
    return { minutes, seconds }
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  const getMarkedCount = () => {
    return Object.values(markedForReview).filter(Boolean).length
  }

  const getAnsweredCountBySubject = (subject) => {
    return Object.keys(answers).filter((key) => key.startsWith(`${subject}-`)).length
  }

  const handleSubmit = async () => {
    if (!window.confirm("Confirm submit?")) return
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      const testAnswers = JSON.parse(localStorage.getItem("testAnswers")) || []
      const authToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
      const testName = JSON.parse(localStorage.getItem("testName") || '""')

      if (!authToken) {
        alert("No authentication token found!")
        return
      }
      const correctAnswers = []
      const wrongAnswers = []
      const notAttempted = []
      const subjectWiseMarks = {
        Physics: 0,
        Chemistry: 0,
        Biology: 0,
      }
      const endTime = new Date()
      let total_marks = 0
      const totalTimePerSubject = {
        Physics: calculateTotalTime("Physics"),
        Chemistry: calculateTotalTime("Chemistry"),
        Biology: calculateTotalTime("Biology"),
      }
      testAnswers.forEach((answerObj) => {
        const { subject, selectedAnswer, correctAnswer } = answerObj
        const chapter = answerObj.chapterName || "General"
        const questionId = answerObj.question_id
        const marks = selectedAnswer === correctAnswer ? 4 : -1
        const timeSpent = answerObj.timeTaken

        if (selectedAnswer === correctAnswer) {
          subjectWiseMarks[subject] += 4
        } else if (selectedAnswer !== null && selectedAnswer !== "") {
          subjectWiseMarks[subject] -= 1
        }

        const answerPayload = {
          questionId,
          subject,
          chapter,
          selectedAnswer,
          correctAnswer,
          marks,
          timeSpent,
        }

        if (!selectedAnswer) {
          notAttempted.push(answerPayload)
        } else if (selectedAnswer === correctAnswer) {
          correctAnswers.push(answerPayload)
          total_marks += 4
        } else {
          if (selectedAnswer !== "") {
            wrongAnswers.push(answerPayload)
          }
        }
      })
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/createtest/submit-test`,
        {
          correctAnswers,
          wrongAnswers,
          notAttempted,
          total_marks,
          selectedChapters,
          testName,
          startTime,
          endTime,
          subjectWiseMarks,
          totalTimePerSubject,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      )
      toast.success(response.data.message, {
        duration: 5000,
      })
      router.push("/resultCT")
    } catch (error) {
      toast.error("Error submitting test!", {
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoMdClose className="text-3xl text-red-600" />
          </div>
          <p className="text-red-600 text-lg font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const currentQuestionData = questionsData[currentSubject]?.[currentQuestion]
  const subjectConfig = subjectIcons[currentSubject] || subjectIcons.Physics
  const isLowTime = timer < 300

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex flex-col">
      {/* Top Bar (Mobile & Desktop) */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur flex justify-between items-center px-4 py-3 shadow-sm">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full ${isLowTime ? "bg-red-100 animate-pulse" : "bg-blue-100"} transition-all`}>
            <FaClock className={`text-lg ${isLowTime ? "text-red-600" : "text-blue-600"}`} />
          </div>
          <div className="flex gap-0.5 text-xs font-mono">
            <span
              className={`${isLowTime ? "bg-red-600 animate-pulse" : "bg-gray-900"} text-white px-2 py-0.5 rounded`}
            >
              {formattedTime.hours}
            </span>
            <span className="text-gray-500 font-bold px-0.5">:</span>
            <span
              className={`${isLowTime ? "bg-red-600 animate-pulse" : "bg-gray-900"} text-white px-2 py-0.5 rounded`}
            >
              {formattedTime.minutes}
            </span>
            <span className="text-gray-500 font-bold px-0.5">:</span>
            <span
              className={`${isLowTime ? "bg-red-600 animate-pulse" : "bg-gray-900"} text-white px-2 py-0.5 rounded`}
            >
              {formattedTime.seconds}
            </span>
          </div>
        </div>

        {/* Subjects selector - dropdown (Mobile) */}
        <div className="flex gap-1 xl:hidden">
          {selectedSubjects.map((subject) => {
            const SubjectIcon = subjectIcons[subject]?.icon || FaAtom
            const isActive = currentSubject === subject
            const config = subjectIcons[subject] || subjectIcons.Physics
            return (
              <button
                key={subject}
                onClick={() => {
                  setCurrentSubject(subject)
                  setCurrentQuestion(0)
                }}
                className={`flex flex-col items-center px-1 py-0.5 rounded ${
                  isActive ? "bg-gradient-to-r from-blue-400 to-indigo-500 text-white" : "bg-white text-gray-600 border"
                } mx-0.5`}
              >
                <SubjectIcon className={`text-base ${isActive ? "text-white" : config.color}`} />
                <span className="text-xs font-medium">{subject[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Subject Tabs (Desktop) */}
        <div className="hidden xl:flex flex-wrap gap-3 justify-center">
          {selectedSubjects.map((subject) => {
            const isActive = currentSubject === subject
            const config = subjectIcons[subject] || subjectIcons.Physics
            const Icon = config.icon
            return (
              <button
                key={subject}
                onClick={() => {
                  setCurrentSubject(subject)
                  setCurrentQuestion(0)
                }}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all transform hover:scale-105 shadow-lg ${
                  isActive
                    ? `bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white shadow-xl`
                    : "bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white shadow-md border border-gray-200"
                }`}
              >
                <Icon className={`text-xl ${isActive ? "text-white" : config.color}`} />
                <span className="font-semibold">{subject}</span>
                <div
                  className={`w-3 h-3 rounded-full ${isActive ? "bg-white/80" : `${config.bgColor} animate-pulse`}`}
                />
              </button>
            )
          })}
        </div>

        {/* Progress quick show (Mobile) */}
        <button
          onClick={() => setShowProgress(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold shadow xl:hidden"
        >
          <HiOutlineSparkles />
          {getAnsweredCount()}/{totalQuestions}
        </button>

        {/* Submit Button (Desktop) */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="hidden xl:flex relative overflow-hidden px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 items-center gap-3 font-semibold"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
          ) : (
            <FaBolt className="text-lg" />
          )}
          Submit Test
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full hover:translate-x-[-200%] transition-transform duration-1000"></div>
        </button>
      </div>

      {/* Main Content Area (Grid for Desktop) */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Question Section */}
        <div className="xl:col-span-2">
          <div className="bg-white/95 rounded-2xl shadow border border-gray-100 px-4 py-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full filter blur-3xl -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-100/20 to-orange-100/20 rounded-full filter blur-3xl translate-y-10 -translate-x-10"></div>

            {/* Question header */}
            <div className="flex items-center mb-3 gap-2 relative z-10">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${subjectConfig.gradientFrom} ${subjectConfig.gradientTo} flex items-center justify-center text-white`}
              >
                <RiQuestionnaireFill className="text-lg" />
              </div>
              <span className={`font-semibold text-sm ${subjectConfig.color}`}>{currentSubject}</span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="text-xs text-gray-500">
                Q {currentQuestion + 1} / {currentSubjectActualQuestionCount}
              </span>
              <button
                onClick={handleReviewLater}
                className={`ml-auto p-2 rounded-full ${
                  markedForReview[`${currentSubject}-${currentQuestion}`]
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Mark for review"
              >
                <MdFlag className={markedForReview[`${currentSubject}-${currentQuestion}`] ? "animate-pulse" : ""} />
              </button>
            </div>

            {/* Question */}
            <div className="mb-3 text-base font-medium text-gray-900 min-h-[48px] relative z-10">
              {currentQuestionData?.question || "No Question Available"}
            </div>

            {/* Options */}
            <div className="space-y-3 relative z-10">
              {currentQuestionData?.options.map((option, index) => {
                const isSelected = answers[`${currentSubject}-${currentQuestion}`] === index
                const isHovered = hoveredOption === index
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    onMouseEnter={() => setHoveredOption(index)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className={`w-full text-left py-3 px-4 rounded-xl border-2 transition-all relative overflow-hidden
                    ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900 font-semibold"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}
                      >
                        {isSelected && <IoMdCheckmark className="text-white text-sm" />}
                        {isHovered && !isSelected && (
                          <div className="absolute inset-0 bg-blue-100 rounded-full scale-75 opacity-50"></div>
                        )}
                      </div>
                      <span className="text-base">
                        <span className="font-medium text-gray-500 mr-2">({String.fromCharCode(65 + index)})</span>
                        {option}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Clear button */}
            <button
              onClick={handleClearResponse}
              className="flex items-center gap-1 text-xs mt-3 text-red-600 hover:bg-red-50 px-2 py-1 rounded relative z-10"
            >
              <FaEraser className="text-xs" />
              Clear Response
            </button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden xl:block xl:col-span-1 space-y-6">
          {/* Progress Card */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white rounded-3xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <FaCheck className="text-2xl" /> {/* Using FaCheck for progress icon */}
                <h3 className="font-bold text-xl">Test Progress</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IoMdCheckmark className="text-green-300 w-5 h-5" />
                    <span className="text-sm font-medium">Answered</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {getAnsweredCount()}/{totalQuestions}
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaClock className="text-red-300 w-5 h-5" />
                    <span className="text-sm font-medium">Marked</span>
                  </div>
                  <div className="text-3xl font-bold">{getMarkedCount()}</div>
                </div>
              </div>
              <div className="bg-white/20 rounded-full h-3 mb-2">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${(getAnsweredCount() / totalQuestions) * 100}%` }}
                ></div>
              </div>
              <p className="text-center text-sm font-medium">
                {Math.round((getAnsweredCount() / totalQuestions) * 100)}% Complete
              </p>
            </div>
          </div>

          {/* Question Navigation Grid */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-10 h-10 bg-gradient-to-br ${subjectConfig.gradientFrom} ${subjectConfig.gradientTo} rounded-2xl flex items-center justify-center text-white shadow-lg`}
              >
                <MdVisibility className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{currentSubject} Questions</h3>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {Array.from({ length: currentSubjectActualQuestionCount }).map((_, index) => {
                const isCurrentQuestion = currentQuestion === index
                const isAnswered = answers[`${currentSubject}-${index}`] !== undefined
                const isMarked = markedForReview[`${currentSubject}-${index}`]
                const isVisited = visitedQuestions[`${currentSubject}-${index}`]
                let buttonClass =
                  "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all transform hover:scale-110 shadow-lg relative "
                if (isCurrentQuestion) {
                  buttonClass += "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-300 scale-110"
                } else if (isMarked) {
                  buttonClass += "bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-red-300"
                } else if (isAnswered) {
                  buttonClass += "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-green-300"
                } else if (isVisited) {
                  buttonClass += "bg-gradient-to-br from-orange-400 to-pink-400 text-white shadow-orange-300"
                } else {
                  buttonClass += "bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-gray-200"
                }
                return (
                  <button key={index} onClick={() => setCurrentQuestion(index)} className={buttonClass}>
                    {index + 1}
                    {isCurrentQuestion && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-white/30 to-transparent animate-pulse"></div>
                    )}
                  </button>
                )
              })}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md"></div>
                <span className="text-gray-600 font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-md"></div>
                <span className="text-gray-600 font-medium">Marked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-pink-400 rounded-md"></div>
                <span className="text-gray-600 font-medium">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md"></div>
                <span className="text-gray-600 font-medium">Current</span>
              </div>
            </div>
          </div>

          {/* Subject Statistics */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <HiOutlineSparkles className="w-6 h-6 text-indigo-600" />
              Subject Statistics
            </h3>
            <div className="space-y-4">
              {selectedSubjects.map((subject) => {
                const subjectQuestions = questionsData[subject]?.length || 0
                const subjectAnswered = getAnsweredCountBySubject(subject)
                const percentage = subjectQuestions > 0 ? Math.round((subjectAnswered / subjectQuestions) * 100) : 0
                const Icon = subjectIcons[subject]?.icon || FaAtom
                const config = subjectIcons[subject] || subjectIcons.Physics
                return (
                  <div key={subject} className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-center justify-center text-white shadow-lg`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">{subject}</span>
                        <span className="text-sm text-gray-500 font-medium">
                          {subjectAnswered}/{subjectQuestions}
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} shadow-sm`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-gray-500 mt-1">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <div className="fixed z-40 left-0 right-0 bottom-0 w-full bg-white/95 backdrop-blur border-t border-gray-200 flex justify-between items-center px-2 py-2 shadow-md xl:hidden">
        <button
          onClick={() => handleNavigation("prev")}
          disabled={currentQuestion === 0 && selectedSubjects.indexOf(currentSubject) === 0}
          className="flex flex-col items-center px-2 py-1 text-xs disabled:opacity-50"
        >
          <FaChevronLeft className="text-lg" />
          Prev
        </button>
        <button onClick={() => setShowNavGrid(true)} className="flex flex-col items-center px-2 py-1 text-xs">
          <MdVisibility className="text-lg" />
          Questions
        </button>
        <button onClick={handleReviewLater} className="flex flex-col items-center px-2 py-1 text-xs">
          <FaFlag
            className={`text-lg ${markedForReview[`${currentSubject}-${currentQuestion}`] ? "text-pink-500" : ""}`}
          />
          Mark
        </button>
        <button onClick={() => setShowStats(true)} className="flex flex-col items-center px-2 py-1 text-xs">
          <HiOutlineSparkles className="text-lg" />
          Stats
        </button>
        <button
          onClick={() => handleNavigation("next")}
          disabled={
            currentQuestion === currentSubjectActualQuestionCount - 1 &&
            selectedSubjects.indexOf(currentSubject) === selectedSubjects.length - 1
          }
          className="flex flex-col items-center px-2 py-1 text-xs disabled:opacity-50"
        >
          <FaChevronRight className="text-lg" />
          Next
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex flex-col items-center px-2 py-1 text-xs text-red-600"
        >
          {isSubmitting ? (
            <div className="animate-spin h-5 w-5 border-b-2 border-red-500 rounded-full"></div>
          ) : (
            <FaBolt className="text-lg" />
          )}
          Submit
        </button>
      </div>

      {/* Question Navigation Modal (Mobile Only) */}
      {showNavGrid && (
        <div className="fixed z-50 inset-0 bg-black/40 flex flex-col items-center justify-end xl:hidden">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center mb-2">
              <MdVisibility className="text-xl mr-1" />
              <span className="font-bold text-gray-900 text-lg flex-1">{currentSubject} Questions</span>
              <button onClick={() => setShowNavGrid(false)} className="text-xl px-2">
                &times;
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: currentSubjectActualQuestionCount }).map((_, index) => {
                const isCurrentQuestion = currentQuestion === index
                const isAnswered = answers[`${currentSubject}-${index}`] !== undefined
                const isMarked = markedForReview[`${currentSubject}-${index}`]
                const isVisited = visitedQuestions[`${currentSubject}-${index}`]
                let buttonClass =
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all "
                if (isCurrentQuestion) {
                  buttonClass += "bg-gradient-to-br from-blue-600 to-indigo-700 text-white scale-110"
                } else if (isMarked) {
                  buttonClass += "bg-gradient-to-br from-red-500 to-pink-500 text-white"
                } else if (isAnswered) {
                  buttonClass += "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                } else if (isVisited) {
                  buttonClass += "bg-gradient-to-br from-orange-400 to-pink-400 text-white"
                } else {
                  buttonClass += "bg-gray-100 text-gray-600"
                }
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestion(index)
                      setShowNavGrid(false)
                    }}
                    className={buttonClass}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded"></div>
                Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-pink-500 rounded"></div>
                Marked
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-pink-400 rounded"></div>
                Visited
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded"></div>
                Current
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal (Mobile Only) */}
      {showProgress && (
        <div className="fixed z-50 inset-0 bg-black/40 flex items-end xl:hidden">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[50vh]">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineSparkles className="text-xl" />
              <span className="font-bold text-lg">Test Progress</span>
              <button onClick={() => setShowProgress(false)} className="text-xl px-2 ml-auto">
                &times;
              </button>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 text-center bg-blue-100 rounded p-2">
                <div className="text-xs text-blue-900">Answered</div>
                <div className="text-lg font-bold">{getAnsweredCount()}</div>
              </div>
              <div className="flex-1 text-center bg-red-100 rounded p-2">
                <div className="text-xs text-red-900">Marked</div>
                <div className="text-lg font-bold">{getMarkedCount()}</div>
              </div>
              <div className="flex-1 text-center bg-green-100 rounded p-2">
                <div className="text-xs text-green-900">Remaining</div>
                <div className="text-lg font-bold">{totalQuestions - getAnsweredCount()}</div>
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                style={{ width: `${(getAnsweredCount() / totalQuestions) * 100}%` }}
              ></div>
            </div>
            <div className="text-center text-xs mt-2">
              {Math.round((getAnsweredCount() / totalQuestions) * 100)}% complete
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal (Mobile Only) */}
      {showStats && (
        <div className="fixed z-50 inset-0 bg-black/40 flex items-end xl:hidden">
          <div className="w-full bg-white rounded-t-2xl p-4 max-h-[65vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineSparkles className="text-xl" />
              <span className="font-bold text-lg">Subject Statistics</span>
              <button onClick={() => setShowStats(false)} className="text-xl px-2 ml-auto">
                &times;
              </button>
            </div>
            <div className="space-y-2">
              {selectedSubjects.map((subject) => {
                const subjectQuestions = questionsData[subject]?.length || 0
                const subjectAnswered = getAnsweredCountBySubject(subject)
                const percentage = subjectQuestions > 0 ? Math.round((subjectAnswered / subjectQuestions) * 100) : 0
                const SubjectIcon = subjectIcons[subject]?.icon || FaAtom
                const config = subjectIcons[subject] || subjectIcons.Physics
                return (
                  <div key={subject} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} flex items-center justify-center text-white`}
                    >
                      <SubjectIcon className="text-base" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{subject}</span>
                        <span className="text-xs text-gray-500">
                          {subjectAnswered}/{subjectQuestions}
                        </span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Particle FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          >
            <div className="w-2 h-2 bg-blue-400/20 rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default TestInterface
