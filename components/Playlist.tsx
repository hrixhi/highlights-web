import {
    BookOpenIcon,
    CheckIcon,
    ListBulletIcon,
    PencilSquareIcon,
    PresentationChartLineIcon,
    QuestionMarkCircleIcon,
    Squares2X2Icon,
    VideoCameraIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

const Playlist: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const dummyPlaylistData = [
        {
            id: 'unit1',
            label: 'Unit 1',
            title: 'Industrialization',
            status: 'completed',
            difficultyLevel: 'easy',
            performance: '',
            progressBar: 100,
            progressBarColor: 'green',
            liveLessons: [
                {
                    status: 'completed',
                    lessonType: 'Learning Objectives',
                    lessonTypeIcon: ListBulletIcon,
                    minifiedDate: 'Aug 18',
                    date: 'Aug 18, 8 am - 9 am',
                    title: 'Learning Objectives',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Aug 20',
                    time: 'Aug 23, 8 am - 9 pm',
                    title: 'Origins of the Industrial Revolution',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Aug 22',
                    time: 'Aug 26, 8 am - 9 pm',
                    title: 'Global Industrialization',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: QuestionMarkCircleIcon,
                    lessonType: 'quiz',
                    time: 'due Aug 30, 11:59pm',
                    title: 'Global Industrialization',
                    score: 45,
                    points: 50,
                },
            ],
            selfPacedLessons: [
                // Option of modalities &
                {
                    status: 'completed',
                    lessonTypeIcon: null,
                    modalityOptions: ['audio', 'video', 'reading'],
                    lessonType: 'Learn',
                    time: 'Aug 20, 11:59pm',
                    title: 'Do 2/3 Readings',
                },
                // Option of practice
                {
                    status: 'completed',
                    lessonTypeIcon: Squares2X2Icon,
                    lessonType: 'Practice',
                    time: 'Aug 20, 11:59pm',
                    title: 'Do 2/3 ',
                },
                // Test
                {
                    status: 'completed',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Aug 20, 11:59pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
                // Optional
                {
                    status: 'completed',
                    lessonTypeIcon: VideoCameraIcon,
                    lessonType: 'Extra: Video',
                    title: 'Henry Ford & Assembly Line',
                    score: 15,
                    points: 20,
                },
            ],
            // Testing
            totalPointsPossible: 120,
            score: 105,
        },
        {
            id: 'unit2',
            label: 'Unit 2',
            title: 'WWI',
            status: 'completed',
            difficultyLevel: 'medium',
            performance: '',
            progressBar: 100,
            progressBarColor: 'green',
            liveLessons: [
                {
                    status: 'completed',
                    lessonType: 'Learning Objectives',
                    lessonTypeIcon: ListBulletIcon,
                    minifiedDate: 'Aug 18',
                    date: 'Aug 18, 8 am - 9 am',
                    title: 'Learning Objectives',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Aug 20',
                    time: 'Aug 23, 8 am - 9 pm',
                    title: 'Origins of the Industrial Revolution',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Aug 22',
                    time: 'Aug 26, 8 am - 9 pm',
                    title: 'Global Industrialization',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: QuestionMarkCircleIcon,
                    lessonType: 'quiz',
                    time: 'due Aug 30, 11:59pm',
                    title: 'Global Industrialization',
                    score: 45,
                    points: 50,
                },
            ],
            selfPacedLessons: [
                // Option of modalities &
                {
                    status: 'completed',
                    lessonTypeIcon: null,
                    modalityOptions: ['audio', 'video', 'reading'],
                    lessonType: 'Learn',
                    time: 'Aug 20, 11:59pm',
                    title: 'Do 2/3 Readings',
                },
                // Option of practice
                {
                    status: 'completed',
                    lessonTypeIcon: Squares2X2Icon,
                    lessonType: 'Practice',
                    time: 'Aug 20, 11:59pm',
                    title: 'Do 2/3 ',
                },
                // Test
                {
                    status: 'completed',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Aug 20, 11:59pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
                // Optional
                {
                    status: 'completed',
                    lessonTypeIcon: VideoCameraIcon,
                    lessonType: 'Extra: Video',
                    title: 'Henry Ford & Assembly Line',
                    score: 15,
                    points: 20,
                },
            ],
            // Testing
            totalPointsPossible: 120,
            score: 105,
        },
        {
            id: 'unit3',
            label: 'Unit 3',
            title: 'WWII',
            status: 'in-progress',
            difficultyLevel: 'hard',
            progressBar: 40,
            progressBarColor: 'yellow',
            liveLessons: [
                {
                    status: 'completed',
                    lessonType: 'Learning Objectives',
                    lessonTypeIcon: ListBulletIcon,
                    minifiedDate: 'Sep 18',
                    date: 'Sep 18, 8 am - 9 am',
                    title: 'Learning Objectives',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Sep 20',
                    time: 'Sep 23, 8 am - 9 pm',
                    title: 'Origins of the Industrial Revolution',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Sep 22',
                    time: 'Sep 26, 8 am - 9 pm',
                    title: 'Global Industrialization',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: QuestionMarkCircleIcon,
                    lessonType: 'quiz',
                    time: 'due Sep 30, 11:59pm',
                    title: 'Global Industrialization',
                    score: 45,
                    points: 50,
                },
            ],
            selfPacedLessons: [
                // Option of modalities &
                {
                    status: 'completed',
                    lessonTypeIcon: null,
                    modalityOptions: ['audio', 'video', 'reading'],
                    lessonType: 'Learn',
                    time: 'Aug 20, 11:59pm',
                    title: 'Do 2/3 Readings',
                },
                // Option of practice
                {
                    status: 'completed',
                    lessonTypeIcon: Squares2X2Icon,
                    lessonType: 'Practice',
                    time: 'Aug 20, 11:59pm',
                    title: 'Do 2/3 ',
                },
                // Test
                {
                    status: 'completed',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Aug 20, 11:59pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
                // Optional
                {
                    status: 'completed',
                    lessonTypeIcon: VideoCameraIcon,
                    lessonType: 'Extra: Video',
                    title: 'Henry Ford & Assembly Line',
                    score: 15,
                    points: 20,
                },
            ],
            // Testing
            totalPointsPossible: 120,
            score: 105,
        },
        // {
        //     id: 'unit4',
        //     label: 'Unit 4',
        //     status: 'to-do',
        //     difficultyLevel: 'TBD',
        //     lessons: [],
        // },
        // {
        //     id: 'unit5',
        //     label: 'Unit 5',
        //     status: 'to-do',
        //     difficultyLevel: 'TBD',
        //     lessons: [],
        // },
    ];

    return <div></div>;
};

export default Playlist;
