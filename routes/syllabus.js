const express = require('express');
const router = express.Router();
const Syllabus = require('../models/Syllabus');
const SyllabusEntry = require('../models/SyllabusEntry');
const User = require('../models/User');
const session = require('express-session');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const PastReview = require('../models/PastReview');
const Author = require('../models/Author'); // Adjust the path if necessary
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult'); // Import the QuizResult model
const StudentQuizResult = require('../models/StudentQuizResult');


// Set up session middleware
router.use(session({
    secret: 'Shaik@786',
    resave: false,
    saveUninitialized: false
}));

// Middleware to protect routes
const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/syllabus/login'); // Redirect to login if not authenticated
};

// Route to render login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Route to handle login submission
router.post('/login', async (req, res) => {
    const { userId, password } = req.body;
    try {
        const user = await User.findOne({ userId });
        if (!user || user.password !== password) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Set user details in session, including ObjectId
        req.session.user = { 
            _id: user._id, // Store ObjectId here
            userId: user.userId, 
            role: user.role 
        };

        if (user.role === 'student') {
            res.redirect('/syllabus/student'); 
        } else if (user.role === 'teacher') {
            res.redirect('/syllabus/teacher'); 
        }
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred during login. Please try again.' });
    }
});


router.get('/student',ensureAuthenticated, async (req, res) => {
    res.render("dashboardStudent");
});

// Dashboard route for teachers
router.get('/teacher',ensureAuthenticated,async (req, res) => {
    res.render("dashboardTeacher");
    
});

// Route to render add topic form
router.get('/add', ensureAuthenticated, (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.redirect('/syllabus/table'); // Students cannot add topics
    }
    res.render('input', { error: null });
});

// Route to handle adding a new topic
router.post('/add', ensureAuthenticated, async (req, res) => {
    const { regulation, topicName, dateCovered, timeSpent } = req.body; // Removed presentStudents from here

    try {
        // Create a new entry in the SyllabusEntry model
        const syllabusEntry = new SyllabusEntry({
            regulation,
            topicName,
            dateCovered: dateCovered ? new Date(dateCovered) : null,
            timeSpent,
            teacherId: req.session.user._id, // Associate the correct teacher ID
        });

        // Check if the topic already exists for the same regulation and teacher
        const existingTopic = await SyllabusEntry.findOne({
            regulation,
            topicName,
            teacherId: req.session.user._id
        });
        if (existingTopic) {
            return res.render('input', { error: `The topic "${topicName}" already exists for regulation "${regulation}".` });
        }

        await syllabusEntry.save();

        // Fetch all students and create notifications
        const students = await User.find({ role: 'student' }); // Get all students
        for (const student of students) {
            const notification = new Notification({
                studentId: student._id, // Associate the student with the notification
                teacherId: req.session.user._id, // Store the teacher's ID
                message: `A new topic "${topicName}" has been added. Please review it.`,
                syllabusEntryId: syllabusEntry._id, // Reference to the syllabus entry
            });
            await notification.save();
        }

        console.log('New Syllabus Entry Added:', syllabusEntry); // Log the added entry
        res.redirect('/syllabus/progress'); // Redirect to progress page
    } catch (err) {
        console.error('Error while adding topic:', err);
        res.status(500).render('input', { error: 'An error occurred while adding the topic. Please try again.' });
    }
});


// Route to render review page for a specific topic
router.get('/review/:syllabusEntryId', ensureAuthenticated, async (req, res) => {
    const { syllabusEntryId } = req.params;

    try {
        const syllabusEntry = await SyllabusEntry.findById(syllabusEntryId);
        if (!syllabusEntry) {
            return res.status(404).send('Topic not found');
        }

        res.render('reviewForm', {
            syllabusEntry: syllabusEntry,
            userRole: req.session.user.role,
        });
    } catch (err) {
        console.error('Error fetching syllabus entry:', err);
        res.status(500).send('Server Error');
    }
});


// Route to handle review submission
router.post('/review/:syllabusEntryId', ensureAuthenticated, async (req, res) => {
    const { rating, comments } = req.body;
    const { syllabusEntryId } = req.params;

    try {
        // Find the syllabus entry to ensure it exists
        const syllabusEntry = await SyllabusEntry.findById(syllabusEntryId);
        if (!syllabusEntry) {
            return res.status(404).send('Syllabus entry not found');
        }

        const review = new Review({
            syllabusEntryId, // Use the syllabus entry ID directly
            rating,
            comments,
            studentId: req.session.user._id, // The student providing the review
        });

        await review.save(); // Save the review to the database
        const pastReview = new PastReview({
            syllabusEntryId,
            rating,
            comments,
            studentId: req.session.user._id,
        });

        await pastReview.save(); 
        await Notification.deleteOne({ syllabusEntryId: syllabusEntryId, studentId: req.session.user._id });
        res.redirect('/syllabus/notifications'); // Redirect to notifications after submission
    } catch (err) {
        console.error('Error while submitting review:', err);
        res.status(500).send('Server Error');
    }
});



// Route to view all reviews for a teacher's topics
router.get('/reviews', ensureAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.redirect('/syllabus/table'); // Only teachers can access reviews
    }

    try {
        const syllabusEntries = await SyllabusEntry.find({ teacherId: req.session.user._id });
        const reviews = await Review.find({ syllabusEntryId: { $in: syllabusEntries.map(entry => entry._id) } })
            .populate('studentId'); // Populate student data

        res.render('reviewList', {
            reviews,
            userRole: req.session.user.role,
        });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).send('Server Error');
    }
});




// Route to fetch and display notifications for the logged-in student
router.get('/notifications', ensureAuthenticated, async (req, res) => {
    try {
        const notifications = await Notification.find({ studentId: req.session.user._id })
            .populate('syllabusEntryId')  // Populate syllabus entry to access topicName
            .populate('teacherId');       // Populate teacher to access teacher details

        res.render('notifications', {
            notifications,
            userRole: req.session.user.role,
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).send('Server Error');
    }
});





// Route to view the syllabus progress in a table format
router.get('/table', ensureAuthenticated, async (req, res) => {
    try {
        let syllabusEntries;

        // Check user role to fetch appropriate syllabus entries
        if (req.session.user.role === 'student') {
            // Fetch entries for the logged-in student
            syllabusEntries = await SyllabusEntry.find();
        } else {
            // Fetch entries for the logged-in teacher
            syllabusEntries = await SyllabusEntry.find({});
        }

        res.render('table', {
            syllabusEntries,
            userRole: req.session.user.role // Ensure to pass the user role here
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// Route to view the syllabus progress in a table format
router.get('/tables', ensureAuthenticated, async (req, res) => {
    try {
        let syllabusEntries;

        // Check user role to fetch appropriate syllabus entries
        if (req.session.user.role === 'student') {
            // Fetch entries for the logged-in student
            syllabusEntries = await SyllabusEntry.find();
        } else {
            // Fetch entries for the logged-in teacher
            syllabusEntries = await SyllabusEntry.find({});
        }

        res.render('table2', {
            syllabusEntries,
            userRole: req.session.user.role // Ensure to pass the user role here
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});




// Route to view the syllabus progress
router.get('/progress', ensureAuthenticated, async (req, res) => {
    try {
        const user = req.session.user; // Get the logged-in user from session

        // Fetch entries for the logged-in user's course ID (teacherId for teachers or studentId for students)
        const syllabusEntries = await SyllabusEntry.find({ teacherId: user._id }); 

        // If no entries found
        if (!syllabusEntries.length) {
            return res.render('progress', {
                completedTopics: [],
                incompleteTopics: [],
                subject: user.userId // Pass the subject for display
            });
        }

        // Get all topics for the user's syllabus (linked by the regulation code or course ID)
        const syllabus = await Syllabus.findOne({ code: user.userId });
        if (!syllabus) {
            return res.render('progress', {
                completedTopics: [],
                incompleteTopics: [],
                subject: user.userId // Pass the subject for display
            });
        }

        // Get all topics from the syllabus
        const allTopics = syllabus.units.flatMap(unit => unit.topics.map(topic => topic.topicName));

        // Completed topics for the logged-in user's course ID
        const completedTopics = syllabusEntries.map(entry => entry.topicName);

        // Incomplete topics for the course ID
        const incompleteTopics = allTopics.filter(topic => !completedTopics.includes(topic));

        // Render progress page with the logged-in user's topics
        res.render('progress', {
            completedTopics,
            incompleteTopics,
            subject: syllabus.subject // Pass subject name for display
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});



// Route to render update form
router.get('/update/:id', ensureAuthenticated, async (req, res) => {
    try {
        const syllabusEntry = await SyllabusEntry.findById(req.params.id);
        if (!syllabusEntry || syllabusEntry.teacherId !== req.session.user.userId) {
            return res.redirect('/syllabus/table'); // Redirect if entry not found or user is not authorized
        }
        res.render('update', { syllabusEntry, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Route to handle syllabus entry updates
router.post('/update/:id', ensureAuthenticated, async (req, res) => {
    const { regulation, topicName, dateCovered, timeSpent } = req.body;

    try {
        const syllabusEntry = await SyllabusEntry.findById(req.params.id);
        if (!syllabusEntry || syllabusEntry.teacherId !== req.session.user.userId) {
            return res.redirect('/syllabus/table'); // Redirect if entry not found or user is not authorized
        }

        // Update the syllabus entry
        syllabusEntry.regulation = regulation;
        syllabusEntry.topicName = topicName;
        syllabusEntry.dateCovered = dateCovered ? new Date(dateCovered) : null;
        syllabusEntry.timeSpent = timeSpent;

        await syllabusEntry.save();
        res.redirect('/syllabus/table'); // Redirect to the syllabus table after updating
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Route to get topics based on regulation for autocomplete
router.get('/topics/:regulation', ensureAuthenticated, async (req, res) => {
    const { regulation } = req.params;
    try {
        const syllabus = await Syllabus.findOne({ code: regulation });
        if (!syllabus) {
            return res.status(404).json({ topics: [] });
        }
        const validTopics = syllabus.units.flatMap(unit => unit.topics.map(topic => topic.topicName));
        res.json({ topics: validTopics });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Route to delete a notification (update to POST)
router.post('/notifications/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        await Notification.findByIdAndDelete(id);
        res.redirect('/syllabus/notifications'); // Redirect to the notifications page after deletion
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ message: 'Error deleting notification.' });
    }
});

// Route to delete a review
router.delete('/reviews/:id', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        await Review.findByIdAndDelete(id);
        res.status(200).json({ message: 'Review deleted successfully.' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ message: 'Error deleting review.' });
    }
});
router.get('/teacher/reviews', ensureAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'teacher') {
        return res.redirect('/syllabus/table'); // Only teachers can access reviews
    }

    try {
        const syllabusEntries = await SyllabusEntry.find({ teacherId: req.session.user._id });

        // Fetch past reviews only
        const pastReviews = await PastReview.find({ syllabusEntryId: { $in: syllabusEntries.map(entry => entry._id) } })
            .populate('syllabusEntryId') // Populate syllabus entry to access topic name
            .populate('studentId'); // Populate student data

        res.render('reviews', {
            pastReviews, // Pass past reviews to the view
            userRole: req.session.user.role,
        });
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).send('Server Error');
    }
});

//bargraph route
router.get('/student/review-analytics', ensureAuthenticated, async (req, res) => {
    if (req.session.user.role !== 'student') {
        return res.redirect('/syllabus/table');
    }

    try {
        const syllabusEntries = await SyllabusEntry.find();
        const reviews = await PastReview.find({
            syllabusEntryId: { $in: syllabusEntries.map(entry => entry._id) }
        })
        .populate('syllabusEntryId')
        .populate('studentId');

        // Check the fetched reviews
        console.log('Fetched Reviews:', reviews);

        // Regulation to Subject mapping inside get
        const regulationToSubject = {
            'R204GA05404': 'DAA',
            'R204GA52502': 'MEFA',
            'R204GA05513': 'COMPILER DESIGN',
            'R204GA05508': 'CO&OS',
            'R204GA33501': 'AI'
        };

        const subjects = ['AI', 'CO&OS', 'DAA', 'COMPILER DESIGN', 'MEFA'];

        const ratingsData = subjects.map(subject => {
            const subjectReviews = reviews.filter(review => {
                const regulation = review.syllabusEntryId.regulation;
                return regulationToSubject[regulation] === subject;
            });

            // Calculate average ratings for each topic
            const ratingsMap = {};
            subjectReviews.forEach(review => {
                const topicName = review.syllabusEntryId.topicName;
                if (!ratingsMap[topicName]) {
                    ratingsMap[topicName] = { sum: 0, count: 0 };
                }
                ratingsMap[topicName].sum += review.rating;
                ratingsMap[topicName].count += 1;
            });

            const averageRatings = [];
            const topicNames = [];
            for (const topic in ratingsMap) {
                averageRatings.push((ratingsMap[topic].sum / ratingsMap[topic].count).toFixed(2));
                topicNames.push(topic);
            }

            // Log to check the average ratings
            console.log(`Ratings for ${subject}:`, averageRatings);
            console.log(`Topic Names for ${subject}:`, topicNames);

            return { ratings: averageRatings, topicNames: topicNames };
        });

        res.render('review-analytics', {
            subjects,
            ratingsData,
        });
    } catch (err) {
        console.error('Error fetching review analytics:', err);
        res.status(500).send('Server Error');
    }
});

// Route to handle logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/syllabus/table'); // Redirect to table on error
        }
        res.redirect('/syllabus/login'); // Redirect to login page after logout
    });
});



router.get('/progress-chart', async (req, res) => {
    try {
        // Fetch all syllabuses and syllabus entries
        const syllabuses = await Syllabus.find({});
        const syllabusEntries = await SyllabusEntry.find({});

        // Create a lookup for syllabusEntries by topicName
        const syllabusEntriesLookup = {};
        syllabusEntries.forEach(entry => {
            syllabusEntriesLookup[entry.topicName] = entry.dateCovered;
        });

        // Process the data to calculate progress for each subject
        let progressData = {};
        
        // These are the five subjects you're tracking
        const subjectsOfInterest = [
            "Artificial Intelligence",
            "Computer Organization and Operating Systems",
            "Compiler Design",
            "Managerial Economics and Financial Analysis",
            "Design and Analysis of Algorithms"
        ];

        syllabuses.forEach((syllabus) => {
            const subject = syllabus.subject;

            if (subjectsOfInterest.includes(subject)) {
                let totalTopics = 0;
                let completedTopics = 0;

                // Calculate total topics for the syllabus
                syllabus.units.forEach(unit => {
                    unit.topics.forEach(topic => {
                        totalTopics++;

                        // Check if the topic has a dateCovered in syllabusEntries
                        if (syllabusEntriesLookup[topic.topicName] && syllabusEntriesLookup[topic.topicName] !== null) {
                            completedTopics++;
                        }
                    });
                });

                // Calculate the percentage of completion
                const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

                // Store progress percentage for the subject
                progressData[subject] = progressPercentage;
            }
        });

        // Render the progressChart EJS view and pass progressData to the frontend
        res.render('progressChart', { progressData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});
// Route to render the add author page
router.get('/add-author', (req, res) => {
    res.render('addAuthor', { error: null }); // Pass error as null initially
});

// Route to handle adding an author
router.post('/add-author', async (req, res) => {
    const { regulation, topic, authorName, bookName } = req.body; // Include regulation

    try {
        // Save the author details to the database
        await Author.create({ regulation, topic, authorName, bookName }); // Save regulation
        console.warn("Author name added");
        res.redirect('/syllabus/add-author'); // Redirect after adding
    } catch (err) {
        console.error(err);
        // If there’s an error, render the addAuthor page with the error message
        res.render('addAuthor', { error: 'Error adding author. Please try again.' });
    }
});

// Route to view authors
router.get('/view-authors', async (req, res) => {
    const authors = await Author.find(); // Fetch authors from the database
    res.render('viewAuthors', { authors });
});

// Route to display the add quiz form
// Route to display the add quiz form
router.get('/add-quiz', ensureAuthenticated, (req, res) => {
    res.render('addQuiz'); // Render the add quiz page
});

// Handle quiz submission
router.post('/add-quiz', ensureAuthenticated, async (req, res) => {
    const { title, questions, deadline  } = req.body;

    if (!req.session.user) {
        return res.status(401).send('User is not authenticated');
    }

    // Handle questions format
    let parsedQuestions = Array.isArray(questions) ? questions : [questions];

    if (typeof parsedQuestions === 'string') {
        try {
            parsedQuestions = JSON.parse(parsedQuestions);
        } catch (error) {
            return res.status(400).send('Invalid questions format');
        }
    }

    const quiz = new Quiz({
        title,
        questions: parsedQuestions,
        createdBy: req.session.user._id,
        deadline: new Date(deadline)
    });

    try {
        await quiz.save();
        res.redirect('/syllabus/view-quizzes');
    } catch (error) {
        console.error('Error saving quiz:', error);
        res.render('addQuiz', { error: 'Failed to save quiz. Please try again.' });
    }
});

// Route to view all quizzes created by the logged-in teacher
router.get('/view-quizzes', ensureAuthenticated, async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect if user is not authenticated
    }

    try {
        const quizzes = await Quiz.find({ createdBy: req.session.user._id });
        const results = [];

        for (const quiz of quizzes) {
            const scores = await StudentQuizResult.find({ quizId: quiz._id })
                .populate('studentId', 'userId username'); // Populate with userId and username

            results.push({
                quizTitle: quiz.title,
                scores
            });
        }

        res.render('viewQuizzes', { results });
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        res.render('viewQuizzes', { results: [], error: 'Failed to fetch quiz results.' });
    }
});

// Route for students to view and answer quizzes
router.get('/quizzes', ensureAuthenticated, async (req, res) => {
    try {
        const quizzes = await Quiz.find();
        const studentId = req.session.user._id;

        // Check if the student has already answered each quiz
        const submittedQuizzes = await StudentQuizResult.find({ studentId }).select('quizId');
        const submittedQuizIds = submittedQuizzes.map(result => result.quizId.toString());

        // Map quizzes to include submission status
        const quizzesWithStatus = quizzes.map(quiz => ({
            ...quiz.toObject(),
            hasSubmitted: submittedQuizIds.includes(quiz._id.toString()),
        }));

        res.render('quizzesList', { quizzes: quizzesWithStatus });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.render('quizzesList', { quizzes: [], error: 'Failed to fetch quizzes.' });
    }
});

// Route to handle quiz answers
router.post('/submit-quiz/:id', ensureAuthenticated, async (req, res) => {
    const quizId = req.params.id;
    const { answers } = req.body;  
    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).send('Quiz not found');
        }
        // Check if the quiz deadline has passed
        const currentDateTime = new Date();
        if (currentDateTime > quiz.deadline) {
            return res.status(400).send('Quiz deadline has passed. You can no longer submit answers.');
        }
        let score = 0;
        quiz.questions.forEach((question, index) => {
            const correctAnswer = question.correctAnswer;
            if (answers[index] === correctAnswer) {
                score += 1;
            }
        });

        // Save the score in the StudentQuizResult model
        await StudentQuizResult.create({
            quizId: quiz._id,
            studentId: req.session.user._id, // Use session info for student ID
            score
        });

        res.render('quizResult', { score, quiz,answers});
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).send('An error occurred while submitting the quiz');
    }
});

// Route to display the results of a submitted quiz
router.get('/quizzes/:id/result', ensureAuthenticated, async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch the quiz using the ID
        const quiz = await Quiz.findById(id);
        if (!quiz) {
            return res.status(404).send('Quiz not found.');
        }

        // Render the quiz result page
        res.render('quizResult', { quiz }); // Pass quiz data to the result page
    } catch (error) {
        console.error('Error fetching quiz result:', error);
        res.status(500).send('Internal server error.');
    }
});

router.get('/view-quiz-results', ensureAuthenticated, async (req, res) => {
    try {
        // Fetch quizzes created by the teacher
        const quizzes = await Quiz.find({ createdBy: req.session.user._id });
        const results = [];

        // For each quiz, fetch the student scores
        for (const quiz of quizzes) {
            const scores = await StudentQuizResult.find({ quizId: quiz._id })
                .populate('studentId', 'userId username'); // Populate userId and username
            results.push({
                quizTitle: quiz.title,
                scores
            });
        }

        res.render('viewQuizResults', { results });
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        res.render('viewQuizResults', { results: [], error: 'Failed to fetch quiz results.' });
    }
});
// Route to view all quizzes and student results
router.get('/student-view-quizzes', ensureAuthenticated, async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Redirect if user is not authenticated
    }

    try {
        // Fetch all quizzes
        const quizzes = await Quiz.find({});
        const results = [];

        for (const quiz of quizzes) {
            // Fetch student's result for the quiz
            const studentScore = await StudentQuizResult.findOne({
                quizId: quiz._id,
                studentId: req.session.user._id // Fetch result for logged-in student
            }).populate('quizId', 'title');

            results.push({
                quizTitle: quiz.title,
                score: studentScore ? studentScore.score : 'Not Attempted' // Show "Not Attempted" if no result found
            });
        }

        res.render('studentViewQuizzes', { results, error: null }); // Pass null for error if no error occurred
    } catch (error) {
        console.error('Error fetching quiz results for student:', error);
        res.render('studentViewQuizzes', { results: [], error: 'Failed to fetch quiz results.' });
    }
});


// Export the router
module.exports = router;