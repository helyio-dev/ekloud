
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://reulddhhokrctpnkqrwo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldWxkZGhob2tyY3RwbmtxcndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTA0NDQsImV4cCI6MjA4ODM2NjQ0NH0.stj9QkbQPZYE0wb4JdcEFGK3rs5_hpIqvZkLE5YEvMY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('--- STUDENT QUIZ QUERY SIMULATION ---')
  const { data: questions, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      difficulty,
      answers (id, answer_text, is_correct)
    `)
    .limit(10)

  if (error) {
    console.error('Query error:', error)
  } else {
    console.log('Found', questions?.length, 'questions.')
    questions?.forEach((q, i) => {
      console.log(`${i+1}. ${q.question_text.substring(0, 30)}...`)
      console.log(`   Answers count: ${q.answers ? q.answers.length : 'NULL/MISSING'}`)
      if (q.answers && q.answers.length > 0) {
          console.log(`   Sample answer: ${q.answers[0].answer_text}`)
      }
    })
  }
}

test()
