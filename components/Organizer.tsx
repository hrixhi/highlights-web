import React, { useEffect, useState } from 'react';
import { classOrganizerDummy } from '../constants/KanbanDummy';
import { ReactSortable } from 'react-sortablejs';

const Organizer: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    // Setup State based on

    const [list1, setList1] = useState([
        {
            id: 32,
            name: 'Research For World Civilizations Paper',
            description:
                'Compare two ancient civilizations. Give brief overview on how these civilizations led to innovations in human history.',
            completed: false,
            daysLeft: 5,
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
        },
        {
            id: 23,
            name: 'Fill out Unit #1 Worksheet',
            description: 'Worksheet covers chapter 1, 2, & 3',
            completed: false,
            daysLeft: 22,
            attachment:
                'https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
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
        },
        {
            id: 65,
            name: 'Unit #2 Readings',
            description: 'Read Chapters 5 and 6 from Unit #2. We will be covering this in class next week.',
            completed: false,
            daysLeft: 7,
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
        },
    ]);

    const [list2, setList2] = useState([
        {
            id: 76,
            name: 'Team #3 Project Review',
            description: '',
            completed: false,
            daysLeft: 9,
            attachment:
                'https://images.unsplash.com/photo-1621356986575-05811227a42e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2370&q=80',
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
        },
        {
            id: 49,
            name: 'Unit #1 Readings',
            description: 'Chapter 1, 2, & 3',
            completed: false,
            daysLeft: 3,
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
        },
    ]);

    const [list3, setList3] = useState([
        {
            id: 87,
            name: 'Team #2 Project Review',
            description: 'Review Goals, Plan with Milestones, Division of roles, etc.',
            completed: true,
            daysLeft: 0,
            attachment:
                'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2357&q=80',
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
        },
        {
            id: 43,
            name: 'Team #1 Project Review',
            description: 'Review Goals, Plan with Milestones, Division of roles, etc.',
            completed: true,
            daysLeft: 0,
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
        },
        {
            id: 34,
            name: 'Unit #1 Learning goals discussion',
            description: 'Discuss learning goals and outcomes for project 1.',
            completed: true,
            daysLeft: 0,
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
        },
    ]);

    return (
        <div className="w-full min-h-coursework bg-cues-gray-1 dark:bg-cues-dark-3">
            <div className="flex flex-col mt-2 px-4 sm:px-6 lg:mx-auto lg:px-8">
                <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow">
                            <div className="flex items-start justify-start px-4 mb-6 space-x-4">
                                {classOrganizerDummy.map((list: any, listIndx: number) => {
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

                                                            <div className="flex justify-between">
                                                                <div className="flex items-center justify-start">
                                                                    {item.members.map((member: any) => {
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
            </div>
        </div>
    );
};

export default Organizer;
