import { CheckIcon, ClockIcon, PlusIcon } from '@heroicons/react/20/solid';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { htmlStringParser } from '../helpers/HTMLParser';
import { ReactSortable } from 'react-sortablejs';
import { myOrganizerDummy } from '../constants/KanbanDummy';

const MyWorkspace: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const tabs = ['Notes', 'Organizer'];
    const [tab, setTab] = useState('Notes');

    const [showFilterPopup, setShowFilterPopup] = useState(false);

    const { loadingCues, myNotes, myNotesCategories, filterAndSortedNotes } = useAppContext();

    console.log('My Notes', myNotes);
    console.log('filterAndSortedNotes', filterAndSortedNotes);

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const courseColor = {
        Art: '#d94a8c',
        Literature: '#6fb1a0',
        History: '#EA515F',
        Math: '#1184a7',
    };

    const [list1, setList1] = useState([
        {
            id: 32,
            name: 'Review Notes for Exam 2',
            description: 'Included Chapters are 4, 5, 6. Attached are notes. Also review to notes from studio.',
            completed: false,
            daysLeft: 5,
            course: 'Art',
        },
        {
            id: 23,
            name: 'Assignment #1 Draft',
            description: 'Essay on William Blake poem.',
            completed: false,
            daysLeft: 22,
            attachment:
                'https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            course: 'Literature',
        },
        {
            id: 65,
            name: 'Homework Solutions',
            description: 'Pending Questions - 3, 4, 5, 6',
            completed: false,
            daysLeft: 7,
            course: 'Math',
        },
    ]);

    const [list2, setList2] = useState([
        {
            id: 76,
            name: 'Team #3 Project Review',
            description: 'Divide work between team members. Come up with Plans & milestones.',
            completed: false,
            daysLeft: 9,
            attachment:
                'https://images.unsplash.com/photo-1621356986575-05811227a42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
            course: 'History',
        },
        {
            id: 49,
            name: 'Unit #1 Readings',
            description: 'Chapter 1, 2, & 3',
            completed: false,
            daysLeft: 3,
            course: 'Literature',
        },
    ]);

    const [list3, setList3] = useState([
        {
            id: 87,
            name: 'Review Notes for Exam 1',
            description: 'Included chapters are 1, 2, 3',
            completed: true,
            daysLeft: 0,
            attachment:
                'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2357&q=80',
            course: 'History',
        },
        {
            id: 43,
            name: 'Team #1 Project Review',
            description: '',
            completed: true,
            daysLeft: 0,
            course: 'Art',
        },
        {
            id: 34,
            name: 'Unit #1 Learning goals discussion',
            description: 'Discuss learning goals and outcomes for project 1.',
            completed: true,
            daysLeft: 0,
            course: 'Math',
        },
    ]);

    const renderPriorityTag = (priority: number) => {
        const priorityLabelMap = {
            '0': 'Very Low',
            '1': 'Low',
            '2': 'Mid',
            '3': 'High',
            '4': 'Very High',
        };

        const priorityColorMap = {
            '0': 'gray',
            '1': 'green',
            '2': 'yellow',
            '3': 'red',
            '4': 'pink',
        };

        const color = priorityColorMap[priority.toString()];

        return (
            <span
                className={`inline-flex items-center rounded-full bg-${color}-100 dark:bg-${color}-200 px-2.5 py-0.5 text-xs font-medium text-${color}-800 mr-4`}
            >
                {priorityLabelMap[priority.toString()]}
            </span>
        );
    };

    const renderCourseTag = (courseName: string) => {
        return (
            <span
                className={'mr-4 inline-flex items-center rounded-lg px-3 text-sm font-medium text-white'}
                style={{
                    backgroundColor: courseColor[courseName],
                }}
            >
                {/* <CheckIcon className="w-3 h-3 mr-1" /> */}
                {courseName}
            </span>
        );
    };

    const renderMyNotes = () => {
        if (myNotes.length === 0 || !myNotes) {
            return (
                <div className="flex flex-1 flex-col w-full items-center py-12">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No content shared</h3>

                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-300">
                            Get started by creating a new content.
                        </p>

                        <div className="mt-6">
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
            );
        }

        if (myNotes.length !== 0 && filterAndSortedNotes.length === 0) {
            return (
                <div className="flex flex-1 flex-col w-full items-center py-12">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-16 w-16 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                vectorEffect="non-scaling-stroke"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No results found</h3>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col pt-2 overflow-x-auto">
                <div className="overflow-x-auto ">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow px-4 sm:px-6 lg:mx-auto lg:px-8">
                            <div className="flex items-start justify-start mb-6 space-x-4">
                                {myNotesCategories.map((category: any) => {
                                    const categoryCues = filterAndSortedNotes.filter((cue: any) => {
                                        return cue.customCategory === category;
                                    });

                                    return (
                                        <div className="min-w-cues-carousel">
                                            <div className="py-4 text-base font-semibold text-gray-900 dark:text-gray-300">
                                                {category}
                                            </div>
                                            <div className="mb-4 space-y-4 min-w-cues-carousel">
                                                {categoryCues.map((cue: any, ind: number) => {
                                                    const { title } = htmlStringParser(
                                                        cue.channelId && cue.channelId !== '' ? cue.original : cue.cue
                                                    );
                                                    return (
                                                        <div className="flex flex-col max-w-md p-5 transform rounded-lg shadow border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 hover:bg-gray-100 dark:hover:bg-cues-dark-1">
                                                            <div className="flex items-center justify-between pb-4">
                                                                <div className="text-base font-semibold text-gray-900 dark:text-white">
                                                                    {title}
                                                                </div>
                                                            </div>
                                                            <hr className="mt-2 h-px bg-gray-200 border-0 dark:bg-gray-700 w-full" />
                                                            <div className="mt-4 flex items-center">
                                                                {renderPriorityTag(cue.color)}
                                                                {/* {cue.submission
                                                                    ? ind % 2 === 0
                                                                        ? renderCompletionTag()
                                                                        : renderPendingTag()
                                                                    : null} */}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderMyOrganizer = () => {
        return (
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden shadow">
                        <div className="flex items-start justify-start px-4 mb-6 space-x-4">
                            {myOrganizerDummy.map((list: any, listIndx: number) => {
                                let state = listIndx === 0 ? list1 : listIndx === 1 ? list2 : list3;
                                let setState = listIndx === 0 ? setList1 : listIndx === 1 ? setList2 : setList3;

                                return (
                                    <div className="min-w-kanban">
                                        <div className="py-4 text-base font-semibold text-gray-900 dark:text-gray-300">
                                            {list.title}
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
                                            {state.map((item) => (
                                                <div className="flex flex-col max-w-md p-5 transform bg-white rounded-lg shadow cursor-move dark:bg-gray-800 mb-4">
                                                    <div className="flex items-center justify-between pb-4">
                                                        <div className="text-base font-semibold text-gray-900 dark:text-white">
                                                            {item.name}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            data-modal-toggle="kanban-card-modal"
                                                            className="p-2 text-sm text-gray-500 rounded-lg dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700"
                                                        >
                                                            <svg
                                                                className="w-5 h-5"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                            >
                                                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
                                                                <path
                                                                    fill-rule="evenodd"
                                                                    d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                                                    clip-rule="evenodd"
                                                                ></path>
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {item.attachment && (
                                                        <div className="flex items-center justify-center pb-4">
                                                            <img
                                                                className="bg-contain rounded-lg"
                                                                src={item.attachment}
                                                                alt="attachment"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col">
                                                        <div className="pb-4 text-sm font-normal text-gray-700 dark:text-gray-400">
                                                            {item.description}
                                                        </div>

                                                        <div className="flex items-center">
                                                            {renderCourseTag(item.course)}
                                                            {item.completed ? (
                                                                <div className="flex items-center justify-center px-3 text-sm font-medium text-green-800 bg-green-100 rounded-lg dark:bg-green-200">
                                                                    <svg
                                                                        className="w-4 h-4 mr-1"
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path
                                                                            fill-rule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clip-rule="evenodd"
                                                                        ></path>
                                                                    </svg>
                                                                    Done
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center px-3 text-sm font-medium text-purple-800 bg-purple-100 rounded-lg dark:bg-purple-200">
                                                                    <svg
                                                                        className="w-4 h-4 mr-1"
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                    >
                                                                        <path
                                                                            fill-rule="evenodd"
                                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                                                            clip-rule="evenodd"
                                                                        ></path>
                                                                    </svg>
                                                                    {item.daysLeft} days left
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
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

    const renderTabContent = () => {
        if (tab === 'Notes') {
            return renderMyNotes();
        }

        return renderMyOrganizer();
    };

    return (
        <div className="py-8">
            <div className="hidden sm:block px-4 sm:px-6 lg:mx-auto lg:px-8 ">
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
                                setShowFilterPopup(true);
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
            <div
                className={classNames(
                    tab === 'Notes' ? 'bg-white dark:bg-cues-dark-3' : 'bg-cues-gray-1 dark:bg-cues-dark-2',
                    'pt-8 w-full px-4 sm:px-6 lg:mx-auto lg:px-8'
                )}
            >
                {renderTabContent()}
            </div>
        </div>
    );
};

export default MyWorkspace;
