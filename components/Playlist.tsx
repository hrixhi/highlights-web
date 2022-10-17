import { AdjustmentsHorizontalIcon, ClockIcon, PlayIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon, ArrowTrendingUpIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

import { PlayPauseIcon } from '@heroicons/react/24/solid';

import React, { useState } from 'react';
import { useNavigationContext } from '../contexts/NavigationContext';

import { industrializationDummy, ww1Dummy, ww2Dummy, coldWarDummy } from '../constants/PlaylistDummy';
import { useCourseContext } from '../contexts/CourseContext';
import { ReactSortable } from 'react-sortablejs';

const Playlist: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { coursework } = useCourseContext();

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const [list1, setList1] = useState(industrializationDummy);
    const [list2, setList2] = useState(ww1Dummy);
    const [list3, setList3] = useState(ww2Dummy);
    const [list4, setList4] = useState(coldWarDummy);

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

    const memberImgs = {
        section1: [
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
        section2: [
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
            masteryAchieved: 'GOOD',
        },
        {
            id: 'unit4',
            label: 'Unit 4',
            title: 'End of Empire and Cold War',
            img: 'https://media.istockphoto.com/illustrations/soviet-union-and-usa-flag-together-with-dried-soil-texture-illustration-id686359674?k=20&m=686359674&s=612x612&w=0&h=ZvMajELneoqhIOH5QhpkakxgdZJ0UME459JTfwiqy8Q=',
            status: 'scheduled',
            difficultyChoices: '',
            performance: '',
            progressBar: 0,
            progressBarColor: 'gray',
            start: 'Oct 20',
            end: 'Nov 12',
            totalPointsPossible: 0,
            score: 120,
        },
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
    // if (viewCourse.selectedPlaylist) {
    //     return (
    //         <div className="w-full flex flex-col py-8">
    //             <div className="w-full px-4 sm:px-6 lg:mx-auto lg:px-8">
    //                 <div className="hidden sm:block mb-4">
    //                     <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-cues-border-dark px-4 sm:px-6 lg:mx-auto lg:px-8">
    //                         <nav className="-mb-px flex space-x-8" aria-label="Tabs">
    //                             {tabs.map((option) => (
    //                                 <button
    //                                     key={option}
    //                                     className={classNames(
    //                                         tab === option
    //                                             ? 'border-black text-black dark:border-white dark:text-white'
    //                                             : 'border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-100',
    //                                         'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-md'
    //                                     )}
    //                                     aria-current={tab === option ? 'page' : undefined}
    //                                     onClick={() => setTab(option)}
    //                                 >
    //                                     {option}
    //                                 </button>
    //                             ))}
    //                         </nav>
    //                         <div className="flex items-center mb-2">
    //                             <button
    //                                 type="button"
    //                                 className="mr-3 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
    //                                 onClick={() => {
    //                                     // setShowFilterPopup(true);
    //                                 }}
    //                             >
    //                                 <span className="sr-only">Filter events</span>
    //                                 <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
    //                             </button>
    //                             <button
    //                                 type="button"
    //                                 className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
    //                                 // onClick={() => showAddEvent()}
    //                             >
    //                                 <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
    //                                 New
    //                             </button>
    //                         </div>
    //                     </div>
    //                 </div>
    //                 {renderActivePlaylistContent()}
    //             </div>
    //         </div>
    //     );
    // }

    const renderListView = () => {
        return (
            <>
                {dummyPlaylistData.map((unit: any, unitIndx: number) => {
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
                                            <span className="text-gray-500 dark:text-gray-300 text-sm flex items-center mr-5">
                                                {/* {unit.liveLessons.length} */}
                                                {3}
                                                {/* {'  '} Scheduled */}
                                                <ClockIcon className="w-4 h-4 mx-1" />
                                            </span>

                                            <span className="text-gray-500 dark:text-gray-300 text-sm flex items-center mr-5">
                                                {/* {unit.selfPacedLessons.length} */}
                                                {4}
                                                {/* {'  '} Self-paced */}
                                                <PlayPauseIcon className="w-5 h-5 mx-1" />
                                            </span>

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
            </>
        );
    };

    function days_between(date1, date2) {
        // The number of milliseconds in one day
        const ONE_DAY = 1000 * 60 * 60 * 24;

        // Calculate the difference in milliseconds
        const differenceMs = Math.abs(date1 - date2);

        // Convert back to days and return
        return Math.round(differenceMs / ONE_DAY);
    }

    const renderBoardView = () => {
        return (
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden shadow">
                        <div className="flex items-start justify-start px-4 mb-6 space-x-8">
                            {dummyPlaylistData.map((playlist: any, listIndx: number) => {
                                let state =
                                    listIndx === 0 ? list1 : listIndx === 1 ? list2 : listIndx === 2 ? list3 : list4;
                                let setState =
                                    listIndx === 0
                                        ? setList1
                                        : listIndx === 1
                                        ? setList2
                                        : listIndx === 2
                                        ? setList3
                                        : setList4;

                                return (
                                    <div className="min-w-kanban">
                                        <div className="w-full py-4 flex justify-between items-center">
                                            <div className="flex items-center">
                                                {/*  */}
                                                <div
                                                    className={classNames(
                                                        playlist.status === 'completed'
                                                            ? 'bg-green-500'
                                                            : playlist.status === 'in-progress'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-gray-500',
                                                        'p-1 rounded-full mr-2'
                                                    )}
                                                >
                                                    {playlist.status === 'completed' ? (
                                                        <CheckIcon className="w-4 h-4 text-white" />
                                                    ) : playlist.status === 'in-progress' ? (
                                                        <ArrowPathIcon className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <ClockIcon className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                {/*  */}
                                                <div className="text-lg font-semibold text-gray-900 dark:text-gray-300">
                                                    {playlist.label} - {playlist.title}
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-500 dark:text-gray-300">
                                                {playlist.start}-{playlist.end}
                                            </div>
                                        </div>

                                        <ReactSortable
                                            group={'kanban'}
                                            animation={100}
                                            forceFallback={true}
                                            dragClass={'drag-card'}
                                            ghostClass={'ghost-card'}
                                            easing={'cubic-bezier(0, 0.55, 0.45, 1)'}
                                            list={state}
                                            setList={setState}
                                            class="mb-4 space-y-4 min-w-kanban"
                                        >
                                            {state.map((item) => {
                                                let daysLeft = undefined;

                                                if (item.status === 'to-do') {
                                                    daysLeft = days_between(item.javascriptDate, new Date());
                                                }

                                                return (
                                                    <div className="group flex flex-col max-w-md p-5 transform bg-white rounded-lg shadow cursor-move dark:bg-gray-800 mb-4">
                                                        <div className="flex items-center justify-between pb-4">
                                                            <div className="flex items-center">
                                                                {/* <item.lessonTypeIcon className="w-4 h-4 mr-3 text-black dark:text-white" /> */}
                                                                <div className="text-base font-semibold text-gray-900 dark:text-white">
                                                                    {item.lessonType}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* {item.attachment && (
                                                        <div className="flex items-center justify-center pb-4">
                                                            <img
                                                                className="bg-contain rounded-lg"
                                                                src={item.attachment}
                                                                alt="attachment"
                                                            />
                                                        </div>
                                                    )} */}

                                                        <div className="flex flex-col">
                                                            {item.title && (
                                                                <div className="pb-4 text-sm font-normal text-gray-700 dark:text-gray-400">
                                                                    {item.title}
                                                                </div>
                                                            )}

                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <div className="text-xs font-normal text-gray-700 dark:text-gray-400 mr-3">
                                                                        {item.type === 'self-paced' ? (
                                                                            <PlayPauseIcon className="w-4 h-4 text-pink-800" />
                                                                        ) : (
                                                                            <ClockIcon className="w-4 h-4 text-blue-800" />
                                                                        )}
                                                                    </div>

                                                                    <div className="text-xs font-normal text-gray-700 dark:text-gray-400 mr-3">
                                                                        {item.minifiedDate}
                                                                    </div>

                                                                    {item.points && (
                                                                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-800 mr-3">
                                                                            {item.points} pts
                                                                        </span>
                                                                    )}

                                                                    {item.status === 'completed' ? (
                                                                        <div className="flex items-center justify-center px-2.5 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-200">
                                                                            Done
                                                                        </div>
                                                                    ) : daysLeft ? (
                                                                        <div className="flex items-center justify-center px-2.5 py-0.5 text-xs font-medium text-purple-800 bg-purple-100 rounded-full dark:bg-purple-200">
                                                                            {daysLeft} days left
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center justify-center px-2.5 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full dark:bg-yellow-200">
                                                                            In progress
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {item.members && item.members !== 'all' && (
                                                                    <div className="flex items-center justify-start">
                                                                        {memberImgs[item.members].map((member: any) => {
                                                                            return (
                                                                                <a href="#" className="-mr-3">
                                                                                    <img
                                                                                        className="border-2 border-white rounded-full h-7 w-7 dark:border-gray-800"
                                                                                        src={member.avatar}
                                                                                        alt={member.name}
                                                                                    />
                                                                                </a>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </ReactSortable>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className={classNames(
                coursework.activePlaylistTab === 'lists' ? 'bg-white' : 'bg-cues-gray-1',
                'w-full flex flex-col py-8 dark:bg-cues-dark-3'
            )}
        >
            <div className="w-full px-4 sm:px-6 lg:mx-auto lg:px-8">
                {coursework.activePlaylistTab === 'lists' ? renderListView() : renderBoardView()}
            </div>
        </div>
    );
};

export default Playlist;
