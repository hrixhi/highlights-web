import { AdjustmentsHorizontalIcon, ClockIcon, PlayIcon } from '@heroicons/react/20/solid';
import {
    ArrowPathIcon,
    ArrowTrendingUpIcon,
    BookOpenIcon,
    CheckIcon,
    EllipsisHorizontalIcon,
    ListBulletIcon,
    PaintBrushIcon,
    PencilSquareIcon,
    PlusIcon,
    PresentationChartLineIcon,
    QuestionMarkCircleIcon,
    Squares2X2Icon,
    StarIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

import { VideoCameraIcon, PlayPauseIcon } from '@heroicons/react/24/solid';

import React, { useState } from 'react';
import { useNavigationContext } from '../contexts/NavigationContext';

const Playlist: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const isExpandedIndex = useState(-1);

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const renderDifficultyTag = (difficulty: string) => {
        const difficultyColorMap = {
            easy: 'gray',
            medium: 'yellow',
            hard: 'red',
        };

        const color = difficultyColorMap[difficulty];

        return (
            <span
                className={`inline-flex items-center rounded-full bg-cues-gray-1 dark:bg-white px-2.5 py-0.5 text-xs font-medium text-${color}-200 mr-4 capitalize`}
            >
                {difficulty}
            </span>
        );
    };

    const { setSelectedPlaylist, viewCourse } = useNavigationContext();

    const [tab, setTab] = useState('Content');
    const tabs = ['Content', 'Analytics'];

    function randomIntFromInterval(min: number, max: number) {
        // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    const renderCompletionStatus = (status: string) => {
        if (status === 'completed') {
            return (
                <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-green-600 hover:bg-green-900">
                    <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
                    <span className="sr-only">Completed</span>
                </div>
            );
        }

        if (status === 'completed') {
            return (
                <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-yellow-600 hover:bg-yellow-900">
                    <ClockIcon className="h-4 w-4 text-white" aria-hidden="true" />
                    <span className="sr-only">Completed</span>
                </div>
            );
        }
        return <div className=""></div>;
    };

    const renderAssignedTo = () => {
        const assignmentOptions = [
            {
                members: [
                    {
                        id: 1,
                        name: 'Dries Vincent',
                        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                    {
                        id: 2,
                        name: 'Lindsay Walton',
                        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                    {
                        id: 3,
                        name: 'Courtney Henry',
                        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                ],
                label: 'Section 1',
            },
            {
                members: [
                    {
                        id: 1,
                        name: 'Bonnie Green',
                        avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                    {
                        id: 2,
                        name: 'Whitney Francis',
                        avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                    {
                        id: 3,
                        name: 'Floyd Miles',
                        avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                ],
                label: 'Section 2',
            },
            {
                members: [
                    {
                        id: 1,
                        name: 'Floyd Miles',
                        avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                    {
                        id: 2,
                        name: 'Dries Vincent',
                        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                    {
                        id: 3,
                        name: 'Bonnie Green',
                        avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                    },
                ],
                label: 'All users',
            },
        ];

        let randInt = randomIntFromInterval(0, 2);
        const members = assignmentOptions[randInt].members;
        const label = assignmentOptions[randInt].label;

        return (
            <div className="flex items-center">
                <div className="flex items-center justify-start mr-2">
                    {members.map((member: any) => {
                        return (
                            <a href="#" className="-mr-3">
                                <img
                                    className="border-2 border-white rounded-full h-7 w-7 dark:border-[#1B1D21]"
                                    src={member.avatar}
                                    alt={member.name}
                                />
                            </a>
                        );
                    })}
                </div>
                <div className="ml-3 text-xs capitalize text-gray-500 dark:text-gray-300">{label}</div>
            </div>
        );
    };

    const dummyPlaylistData = [
        {
            id: 'unit1',
            label: 'Unit 1',
            title: 'Industrialization',
            img: 'https://sites.google.com/site/industrializationinmodernworld/_/rsrc/1327876028446/home/industrial-revolution.jpg',
            status: 'completed',
            difficultyLevel: 'medium',
            progressBar: 100,
            start: 'Aug 18',
            end: 'Aug 30',
            progressBarColor: 'green',
            liveLessons: [
                {
                    status: 'completed',
                    lessonType: 'Learning Objectives',
                    lessonTypeIcon: ListBulletIcon,
                    minifiedDate: 'Aug 18',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Aug 20',
                    time: 'Aug 23, 8 am - 9 am',
                    title: 'Origins of the Industrial Revolution',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Aug 22',
                    time: 'Aug 26, 8 am - 9 am',
                    title: 'Global Industrialization',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: QuestionMarkCircleIcon,
                    lessonType: 'quiz',
                    time: 'due Aug 30, 11:59 pm',
                    title: 'Global Industrialization',
                    score: 45,
                    points: 50,
                },
            ],
            selfPacedLessons: [
                // Option of modalities &
                {
                    status: 'completed',
                    lessonTypeIcon: BookOpenIcon,
                    modalityOptions: ['audio', 'video', 'reading'],
                    lessonType: 'Learn',
                    time: 'Aug 20, 11:59 pm',
                    title: 'Complete 2/3 Readings',
                },
                // Option of practice
                {
                    status: 'completed',
                    lessonTypeIcon: Squares2X2Icon,
                    lessonType: 'Practice',
                    time: 'Aug 20, 11:59 pm',
                    title: 'Complete 2/3 ',
                },
                // Test
                {
                    status: 'completed',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Aug 20, 11:59 pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
                // Optional
                {
                    status: 'completed',
                    lessonTypeIcon: VideoCameraIcon,
                    lessonType: 'Bonus: Video',
                    title: 'Henry Ford & Assembly Line',
                    score: 15,
                    points: 20,
                },
                {
                    status: 'completed',
                    lessonTypeIcon: VideoCameraIcon,
                    lessonType: 'Bonus: Video',
                    title: 'Henry Ford & Assembly Line',
                    score: 15,
                    points: 20,
                },
            ],
            // Testing
            totalPointsPossible: 120,
            score: 105,
            masteryAchieved: 'GREAT',
        },
        {
            id: 'unit2',
            label: 'Unit 2',
            title: 'World War I',
            img: 'https://images.unsplash.com/photo-1571840615922-50fb24649d4b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2430&q=80',
            status: 'completed',
            difficultyLevel: 'medium',
            performance: '',
            progressBar: 100,
            progressBarColor: 'green',
            start: 'Sep 1',
            end: 'Sep 16',
            liveLessons: [
                {
                    status: 'completed',
                    lessonType: 'Learning Objectives',
                    lessonTypeIcon: ListBulletIcon,
                    minifiedDate: 'Sep 3',
                    date: 'Sep 1, 8 am - 9 am',
                },
                // {
                //     status: 'completed',
                //     lessonTypeIcon: PresentationChartLineIcon,
                //     lessonType: 'Lecture',
                //     minifiedDate: 'Sep 5',
                //     time: 'Sep 5, 8 am - 9 am',
                //     title: 'Origins of the Industrial Revolution',
                // },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Sep 9',
                    time: 'Sep 9, 8 am - 9 am',
                    title: 'Global Industrialization',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: QuestionMarkCircleIcon,
                    lessonType: 'quiz',
                    minifiedDate: 'Sep 18',
                    time: 'due Sep 18, 11:59 pm',
                    title: 'Quiz #2',
                    score: 45,
                    points: 50,
                },
            ],
            selfPacedLessons: [
                // Option of modalities &
                {
                    status: 'completed',
                    lessonTypeIcon: BookOpenIcon,
                    modalityOptions: ['audio', 'video', 'reading'],
                    lessonType: 'Learn',
                    time: 'Sep 12, 11:59 pm',
                    title: 'Complete 2/3 Readings',
                },
                // Option of practice
                {
                    status: 'completed',
                    lessonTypeIcon: Squares2X2Icon,
                    lessonType: 'Practice',
                    time: 'Sep 14, 11:59 pm',
                    title: 'Complete 2/3 ',
                },
                // Extra Credit
                // {
                //     status: 'completed',
                //     lessonTypeIcon: VideoCameraIcon,
                //     lessonType: 'Bonus: Video Quiz',
                //     title: 'Henry Ford & Assembly Line',
                //     time: 'Sep 14, 11:59 pm',
                //     score: 15,
                //     points: 20,
                // },
                // Test
                {
                    status: 'completed',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Sep 15, 11:59 pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
            ],
            // Testing
            totalPointsPossible: 150,
            score: 140,
            masteryAchieved: 'GOOD',
        },
        {
            id: 'unit3',
            label: 'Unit 3',
            title: 'World War 2',
            img: 'https://allthatsinteresting.com/wordpress/wp-content/uploads/2017/05/world-war-2-in-color-d-day.jpg',
            status: 'in-progress',
            difficultyLevel: 'hard',
            progressBar: 40,
            progressBarColor: 'yellow',
            start: 'Sep 20',
            end: 'Oct 12',
            liveLessons: [
                {
                    status: 'completed',
                    lessonType: 'Learning Objectives',
                    lessonTypeIcon: ListBulletIcon,
                    minifiedDate: 'Sep 20',
                    date: 'Sep 20, 8 am - 9 am',
                },
                {
                    status: 'in-progress',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Sep 23',
                    time: 'Sep 23, 8 am - 9 am',
                    title: 'Totalitarianism or Liberal Internationalism',
                },
                {
                    status: 'to-do',
                    lessonTypeIcon: PaintBrushIcon,
                    lessonType: 'Activity',
                    minifiedDate: 'Sep 26',
                    time: 'Sep 26, 9 am - 10 am',
                    title: 'Whiteboarding Session on WWII',
                },
                {
                    status: 'to-do',
                    lessonTypeIcon: QuestionMarkCircleIcon,
                    lessonType: 'quiz',
                    time: 'due Oct 12, 11:59 pm',
                    title: 'Quiz #3',
                    score: 45,
                    points: 50,
                },
            ],
            selfPacedLessons: [
                // Option of modalities &
                {
                    status: 'completed',
                    lessonTypeIcon: BookOpenIcon,
                    modalityOptions: ['audio', 'video', 'reading'],
                    lessonType: 'Learn',
                    time: 'Sep 29, 11:59 pm',
                    title: 'Complete 2/3 Readings',
                },
                // Option of practice
                {
                    status: 'to-do',
                    lessonTypeIcon: Squares2X2Icon,
                    lessonType: 'Practice',
                    time: 'Oct 5, 11:59 pm',
                    title: 'Do 3/4 worksheets',
                    difficultyLevel: 'Easy/Medium/Hard',
                },
                // Optional
                {
                    status: 'to-do',
                    lessonTypeIcon: VideoCameraIcon,
                    lessonType: 'Bonus: Video',
                    title: 'Henry Ford & Assembly Line',
                    score: 15,
                    points: 20,
                },
                // Test
                {
                    status: 'completed',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Oct 12, 11:59 pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
            ],

            masteryAchieved: 'GOOD',
        },
        {
            id: 'unit4',
            label: 'Unit 4',
            title: 'End of Empire and Cold War',
            img: 'https://media.istockphoto.com/illustrations/soviet-union-and-usa-flag-together-with-dried-soil-texture-illustration-id686359674?k=20&m=686359674&s=612x612&w=0&h=ZvMajELneoqhIOH5QhpkakxgdZJ0UME459JTfwiqy8Q=',
            status: 'scheduled',
            // difficultyLevel: 'medium',
            difficultyChoices: '',
            performance: '',
            progressBar: 0,
            progressBarColor: 'gray',
            start: 'Oct 12',
            end: 'Nov 1',
            liveLessons: [
                {
                    status: 'to-do',
                    lessonType: 'Learning Objectives',
                    lessonTypeIcon: ListBulletIcon,
                    minifiedDate: 'Sep 3',
                    date: 'Sep 1, 8 am - 9 am',
                },
                {
                    status: 'completed',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Sep 5',
                    time: 'Sep 5, 8 am - 9 am',
                    title: 'Origins of the Industrial Revolution',
                },
                {
                    status: 'to-do',
                    lessonTypeIcon: PresentationChartLineIcon,
                    lessonType: 'Lecture',
                    minifiedDate: 'Sep 9',
                    time: 'Sep 9, 8 am - 9 am',
                    title: 'Global Industrialization',
                },
                {
                    status: 'to-do',
                    lessonTypeIcon: QuestionMarkCircleIcon,
                    lessonType: 'quiz',
                    minifiedDate: 'Sep 18',
                    time: 'due Sep 18, 11:59 pm',
                    title: 'Quiz #2',
                    score: 45,
                    points: 50,
                },
            ],
            selfPacedLessons: [
                // Option of modalities &
                {
                    status: 'to-do',
                    lessonTypeIcon: BookOpenIcon,
                    modalityOptions: ['audio', 'video', 'reading'],
                    lessonType: 'Learn',
                    time: 'Sep 12, 11:59 pm',
                    title: 'Complete 2/3 Readings',
                },
                // Option of practice
                {
                    status: 'to-do',
                    lessonTypeIcon: Squares2X2Icon,
                    lessonType: 'Practice',
                    time: 'Sep 14, 11:59 pm',
                    title: 'Complete 2/3 ',
                },
                // Extra Credit
                // {
                //     status: 'to-do',
                //     lessonTypeIcon: VideoCameraIcon,
                //     lessonType: 'Bonus: Video Quiz',
                //     title: 'Henry Ford & Assembly Line',
                //     time: 'Sep 14, 11:59 pm',
                //     score: 15,
                //     points: 20,
                // },
                // Test
                {
                    status: 'to-do',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Sep 15, 11:59 pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
                {
                    status: 'to-do',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Sep 15, 11:59 pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
                {
                    status: 'to-do',
                    lessonTypeIcon: PencilSquareIcon,
                    lessonType: 'Assignment',
                    time: 'Sep 15, 11:59 pm',
                    title: 'Assignment 1',
                    gradingStatus: 'graded',
                    score: 45,
                    points: 50,
                },
            ],
            // Testing
            totalPointsPossible: 0,
            score: 120,
            // masteryAchieved: 'GOOD',
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

    const renderActivePlaylistContent = () => {
        const { liveLessons, selfPacedLessons } = viewCourse.selectedPlaylist;

        return (
            <div className="w-full flex flex-col py-8 overflow-x-hidden">
                <div className="w-full flex mt-2 px-4 sm:px-6 lg:mx-auto lg:px-8">
                    {/* Section 1 is Live Lessons */}
                    <div className="w-1/2 pr-8 flex flex-col border-r border-cues-border dark:border-cues-border-dark">
                        <div className="flex items-center ">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                Scheduled
                            </h1>
                            <span
                                className={
                                    'bg-gray-100 text-gray-900 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium '
                                }
                            >
                                {liveLessons.length}
                            </span>
                        </div>
                        <div className="flex flex-col mt-8">
                            {liveLessons.map((lesson: any, lessonIdx: number) => {
                                return (
                                    <div
                                        key={lessonIdx}
                                        className="flex flex-col p-5 transform bg-white border border-cues-border dark:border-cues-border-dark rounded-lg shadow dark:bg-cues-dark-3 mb-4 w-full"
                                    >
                                        <div className="flex items-center justify-between pb-4">
                                            <div className="text-md capitalize font-semibold text-gray-900 dark:text-white flex items-center">
                                                <lesson.lessonTypeIcon className="w-5 h-5 mr-2" />
                                                {lesson.lessonType}
                                            </div>
                                            <div className="p-2 text-sm text-gray-500 rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700">
                                                {/* <PencilSquareIcon className="w-5 h-5 " /> */}
                                                {renderCompletionStatus(lesson.status)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            {lesson.title && (
                                                <div className="pb-4 text-md font-normal text-gray-700 dark:text-gray-400">
                                                    {lesson.title}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                {renderAssignedTo()}
                                                <div className="ml-3 text-xs text-gray-500 dark:text-gray-300">
                                                    {lesson.time}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="w-1/2 px-8 flex flex-col">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                Self-paced
                            </h1>
                            <span
                                className={
                                    'bg-gray-100 text-gray-900 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium '
                                }
                            >
                                {selfPacedLessons.length}
                            </span>
                        </div>
                        <div className="flex flex-col mt-8">
                            {selfPacedLessons.map((lesson: any, lessonIdx: number) => {
                                return (
                                    <div
                                        key={lessonIdx}
                                        className="flex flex-col p-5 transform bg-white border border-cues-border dark:border-cues-border-dark rounded-lg shadow dark:bg-cues-dark-3 mb-4 w-full"
                                    >
                                        <div className="flex items-center justify-between pb-4">
                                            <div className="text-md capitalize font-semibold text-gray-900 dark:text-white flex items-center">
                                                <lesson.lessonTypeIcon className="w-5 h-5 mr-2" />
                                                {lesson.lessonType}
                                            </div>
                                            <div className="p-2 text-sm text-gray-500 rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700">
                                                {/* <PencilSquareIcon className="w-5 h-5 " /> */}
                                                {renderCompletionStatus(lesson.status)}
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            {lesson.title && (
                                                <div className="pb-4 text-md font-normal text-gray-700 dark:text-gray-400">
                                                    {lesson.title}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                {renderAssignedTo()}
                                                <div className="ml-3 text-xs text-gray-500 dark:text-gray-300">
                                                    {lesson.time}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Display Analytics for Playlist
    if (viewCourse.selectedPlaylist) {
        return (
            <div className="w-full flex flex-col py-8">
                <div className="w-full px-4 sm:px-6 lg:mx-auto lg:px-8">
                    <div className="hidden sm:block mb-4">
                        <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-cues-border-dark px-4 sm:px-6 lg:mx-auto lg:px-8">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {tabs.map((option) => (
                                    <button
                                        key={option}
                                        className={classNames(
                                            tab === option
                                                ? 'border-black text-black dark:border-white dark:text-white'
                                                : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-100',
                                            'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-md'
                                        )}
                                        aria-current={tab === option ? 'page' : undefined}
                                        onClick={() => setTab(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </nav>
                            <div className="flex items-center mb-2">
                                <button
                                    type="button"
                                    className="mr-3 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                                    onClick={() => {
                                        // setShowFilterPopup(true);
                                    }}
                                >
                                    <span className="sr-only">Filter events</span>
                                    <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                                    // onClick={() => showAddEvent()}
                                >
                                    <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                                    New
                                </button>
                            </div>
                        </div>
                    </div>
                    {renderActivePlaylistContent()}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col py-8">
            <div className="w-full px-4 sm:px-6 lg:mx-auto lg:px-8">
                {dummyPlaylistData.map((unit: any, unitIndx: number) => {
                    let liveCompleted = 0;
                    let selfpacedCompleted = 0;
                    unit.liveLessons.map((lesson: any) => {
                        if (lesson.status === 'completed') {
                            liveCompleted += 1;
                        }
                    });

                    unit.selfPacedLessons.map((lesson: any) => {
                        if (lesson.status === 'completed') {
                            selfpacedCompleted += 1;
                        }
                    });

                    return (
                        <button
                            key={unit.id}
                            className="overflow-hidden h-playlist w-full flex border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 hover:bg-gray-100 dark:hover:bg-cues-dark-1 shadow-sm rounded-md mb-8"
                            onClick={() => {
                                // openCourse(course._id);
                                setSelectedPlaylist(unit);
                            }}
                        >
                            <img className="object-cover w-full md:h-playlist md:w-48 " src={unit.img} alt="" />
                            <div className="w-full flex flex-col w-gull px-8 py-5">
                                <div className="flex w-full items-center">
                                    {/* Status Icon for playlist */}
                                    <div className="flex items-center flex-1">
                                        <h3 className="text-2xl font-medium text-gray-900 dark:text-white">
                                            {unit.title}
                                        </h3>
                                    </div>
                                    <div
                                        className={`ml-4 flex items-center justify-center px-2 text-md font-medium text-${unit.progressBarColor}-800 bg-${unit.progressBarColor}-100 rounded-lg dark:bg-${unit.progressBarColor}-200`}
                                    >
                                        {unit.status === 'completed' ? (
                                            <CheckIcon className="w-4 h-4 mr-1 text-green-500" />
                                        ) : unit.status === 'in-progress' ? (
                                            <ArrowPathIcon className="w-4 h-4 mr-1 text-yellow-500" />
                                        ) : (
                                            <ClockIcon className="w-4 h-4 mr-1 text-gray-500" />
                                        )}
                                        {unit.status === 'completed'
                                            ? 'Done'
                                            : unit.status === 'in-progress'
                                            ? 'In Progress'
                                            : 'Scheduled'}{' '}
                                    </div>
                                </div>
                                {/* Section 2 Will feature Key insights into the playlist */}
                                <div className="w-full flex justify-between mt-6 ">
                                    {unit.status !== 'completed' && (
                                        <div className="flex items-center">
                                            {unit.liveLessons.length && (
                                                <span className="text-gray-500 dark:text-gray-300 text-sm flex items-center mr-5">
                                                    {unit.liveLessons.length}
                                                    {/* {'  '} Scheduled */}
                                                    <ClockIcon className="w-4 h-4 mx-1" />
                                                </span>
                                            )}
                                            {unit.selfPacedLessons.length && (
                                                <span className="text-gray-500 dark:text-gray-300 text-sm flex items-center mr-5">
                                                    {unit.selfPacedLessons.length}
                                                    {/* {'  '} Self-paced */}
                                                    <PlayPauseIcon className="w-5 h-5 mx-1" />
                                                </span>
                                            )}
                                            {unit.difficultyLevel ? (
                                                renderDifficultyTag(unit.difficultyLevel)
                                            ) : (
                                                <span className="text-gray-500 dark:text-gray-300 text-sm flex items-center mr-5">
                                                    3
                                                    <ArrowTrendingUpIcon className="w-5 h-5 mx-1" />
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {/* Here we show the Mastery achieved & Difficulty Level */}
                                    {unit.status === 'completed' ? (
                                        <div className="flex items-center justify-between">
                                            <h1 className="text-sm font-medium text-gray-500 dark:text-gray-300">
                                                {unit.score} / {unit.totalPointsPossible}
                                            </h1>
                                        </div>
                                    ) : unit.status === 'in-progress' ? (
                                        <div>
                                            {/* <button
                                                type="button"
                                                className="text-white dark:text-black bg-black dark:bg-white  focus:ring-4 focus:outline-none font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center mr-2"
                                            >
                                                <PlayIcon className="w-4 h-4" />
                                                <span className="sr-only">Icon description</span>
                                            </button> */}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Section 3 Will feature progress bar with start & end */}
                                <div className="w-full flex flex-col mt-6">
                                    <div className="flex items-center">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                            <div
                                                className={classNames(
                                                    unit.progressBarColor === 'green'
                                                        ? 'bg-green-600'
                                                        : unit.progressBarColor === 'yellow'
                                                        ? 'bg-yellow-400'
                                                        : 'bg-white',
                                                    'h-1.5 rounded-full'
                                                )}
                                                style={{
                                                    width: `${unit.progressBar}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>{' '}
                                    <div className="w-full flex items-center justify-between mt-3">
                                        <div className="text-gray-500 dark:text-gray-300 text-sm">{unit.start}</div>
                                        <div className="text-gray-500 dark:text-gray-300 text-sm">{unit.end}</div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Playlist;
