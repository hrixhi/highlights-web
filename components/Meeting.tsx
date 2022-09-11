import { AdjustmentsHorizontalIcon, PlayIcon, PlusIcon } from '@heroicons/react/20/solid';
import {
    CheckIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    SignalSlashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useCourseContext } from '../contexts/CourseContext';
import { useNavigationContext } from '../contexts/NavigationContext';
import Chart from 'react-apexcharts';

const Meeting: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { meetings } = useCourseContext();

    const { theme } = useNavigationContext();

    const {
        instructorAttendanceBook,
        instructorAttendanceBookError,
        attendanceBookEntries,
        attendanceBookUsers,
        attendanceBookUsersDropdownOptions,
        attendanceBookAnalyticsSelectedUser,
        loadingAttendanceBookInstructor,
    } = meetings;

    const ongoingMeetings = [
        {
            title: 'Lecture',
            description: 'In this lecture we will talk about Ancient Civilizations.',
            joinUrl: 'https://www.zoom.us',
            date: '10 am - 5 pm',
        },
    ];

    const upcomingMeetings = [
        {
            title: 'Group Activity',
            description: 'In this meeting we will do an interesting activity.',
            joinUrl: 'https://www.zoom.us',
            date: 'Sep 22, 10 am - 11 am',
        },
        {
            title: 'Lecture',
            description: 'In this lecture we will talk about the Ice Age.',
            joinUrl: 'https://www.zoom.us',
            date: 'Sep 24, 12 pm - 1 pm',
        },
    ];

    const recordings = [
        {
            title: 'Group Activity',
            description: 'In this meeting we will do an interesting activity.',
            joinUrl: 'https://www.zoom.us',
            date: 'Sep 8, 2022',
            topics: ['Industrial Revolution', 'Henry Ford'],
        },
        {
            title: 'Lecture',
            description: 'Weekly lecture on new topics.',
            joinUrl: 'https://www.zoom.us',
            date: 'Sep 4, 2022',
            topics: ['Natural History'],
        },
        {
            title: 'Lecture',
            description: 'Weekly lecture on new topics.',
            joinUrl: 'https://www.zoom.us',
            date: 'Sep 1, 2022',
            topics: ['Ancient Civilization'],
        },
        {
            title: 'Quiz 1 Review',
            description: 'In this meeting we will revise key concepts for Quiz 1.',
            joinUrl: 'https://www.zoom.us',
            date: 'Aug 28, 2022',
            topics: ['Revision'],
        },
    ];

    const [tab, setTab] = useState('Scheduled');

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const tabs = ['Scheduled', 'Recordings', 'Attendances'];

    const renderAttendanceCharts = () => {
        let attendanceChartColors: any = {};

        if (document.documentElement.classList.contains('dark')) {
            attendanceChartColors = {
                strokeColor: '#111827',
            };
        } else {
            attendanceChartColors = {
                strokeColor: '#ffffff',
            };
        }

        const dummyData = [
            {
                label: 'Present',
                pct: 80,
                color: '#16BDCA',
            },
            {
                label: 'Late',
                pct: 5,
                color: '#FDBA8C',
            },
            {
                label: 'Excused',
                pct: 5,
                color: '#1A56DB',
            },
            {
                label: 'Inexcused',
                pct: 10,
                color: '#D61F69',
            },
        ];

        const labels = dummyData.map((data: any) => data.label);
        const pcts = dummyData.map((data: any) => data.pct);
        const colors = dummyData.map((data: any) => data.color);

        const options = {
            series: pcts,
            labels,
            colors,
            chart: {
                height: 305,
                fontFamily: 'Inter, sans-serif',
                toolbar: {
                    show: false,
                },
            },
            stroke: {
                colors: [attendanceChartColors.strokeColor],
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '5%',
                    },
                },
            },
            states: {
                hover: {
                    filter: {
                        type: 'darken',
                        value: 0.9,
                    },
                },
            },
            tooltip: {
                shared: true,
                followCursor: false,
                fillSeriesColor: false,
                inverseOrder: true,
                style: {
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                },
                x: {
                    show: true,
                    formatter: function (_, { seriesIndex, w }) {
                        const label = w.config.labels[seriesIndex];
                        return label;
                    },
                },
                y: {
                    formatter: function (value) {
                        return value + '%';
                    },
                },
            },
            grid: {
                show: false,
            },
            dataLabels: {
                enabled: false,
            },
            legend: {
                show: false,
            },
        };

        return (
            <div className="flex items-center bg-white dark:bg-cues-dark-3 pb-8">
                <div className="flex-1 p-4 mb-4 rounded-lg sm:p-6 xl:p-8 2xl:col-span-2 xl:mb-0">
                    <div className="mb-8 flex items-center justify-between">
                        {/* <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Attendance Insights</h3> */}
                        <div className="flex items-center ">
                            <img
                                className="inline-block h-12 w-12 rounded-full"
                                src={attendanceBookAnalyticsSelectedUser.img}
                                alt=""
                            />
                            <h1 className="ml-3 text-xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                {attendanceBookAnalyticsSelectedUser.text}
                            </h1>
                            <div className="ml-3 text-center text-xs text-gray-500 rounded-lg hover:text-gray-900 dark:text-gray-400">
                                Change
                            </div>
                        </div>
                        <div className="flex items-cneter">
                            <button
                                className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 rounded-lg hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                type="button"
                                data-dropdown-toggle="sessions-dropdown"
                            >
                                Last 30 days
                                <svg
                                    className="ml-2 w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M19 9l-7 7-7-7"
                                    ></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <ul className="space-y-6" role="list">
                        {dummyData.map((data: any) => {
                            return (
                                <li className="items-center w-full sm:flex">
                                    <div className="flex items-center mb-3 sm:mb-0">
                                        <span className="flex-none mx-5 ml-3 w-32 text-base font-medium text-gray-900 dark:text-white">
                                            {data.label}
                                        </span>
                                    </div>
                                    <div className="w-full h-5 bg-gray-200 rounded-lg dark:bg-gray-700">
                                        <div
                                            className="p-1 h-5 text-xs font-bold leading-none text-center rounded-md text-blue-100 bg-cues-blue"
                                            style={{
                                                width: `${data.pct}%`,
                                            }}
                                        >
                                            {data.pct}%
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="donut">
                    <Chart options={options} series={pcts} type="donut" width="380" height={305} />
                </div>
            </div>
        );
    };

    const renderInstructorView = () => {
        return (
            <table className="stickyTable ">
                {/* First row  */}
                <thead>
                    <tr>
                        {/* First cell will contain search bar */}
                        <th>
                            <form className="flex items-center">
                                <label htmlFor="voice-search" className="sr-only">
                                    Search
                                </label>
                                <div className="relative w-full">
                                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                                        <svg
                                            aria-hidden="true"
                                            className="w-5 h-5 text-gray-500 dark:text-gray-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                                clip-rule="evenodd"
                                            ></path>
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        id="voice-search"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Search "
                                        required
                                    />
                                    {/* <button type="button" className="flex absolute inset-y-0 right-0 items-center pr-3">
                                        <svg
                                            aria-hidden="true"
                                            className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                fill-rule="evenodd"
                                                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                                                clip-rule="evenodd"
                                            ></path>
                                        </svg>
                                    </button> */}
                                </div>
                            </form>
                            {/* <TextInput
                            value={studentSearch}
                            onChangeText={(val: string) => setStudentSearch(val)}
                            placeholder={'Search user'}
                            placeholderTextColor={'#1F1F1F'}
                            style={{
                                width: '100%',
                                maxWidth: 200,
                                borderColor: '#f2f2f2',
                                borderWidth: 1,
                                backgroundColor: '#fff',
                                borderRadius: 24,
                                fontSize: 15,
                                paddingVertical: 8,
                                marginTop: 0,
                                paddingHorizontal: 10,
                            }}
                        /> */}
                        </th>
                        {/* Total column */}
                        <th>
                            <div className="text-black dark:text-white text-sm">Total</div>
                        </th>
                        {/* All assignments */}
                        {attendanceBookEntries.map((entry: any, col: number) => {
                            return (
                                <th onClick={() => {}}>
                                    <div className="text-gray-900 dark:text-gray-400 text-xs">
                                        {new Date(entry.start).toString().split(' ')[1] +
                                            ' ' +
                                            new Date(entry.start).toString().split(' ')[2]}{' '}
                                    </div>
                                    <div className="line-clamp-2 truncate mt-2 text-center">{entry.title}</div>

                                    <div className="w-full mt-2 flex justify-center text-gray-900 dark:text-gray-400">
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                {/* Main Body */}
                <tbody>
                    {instructorAttendanceBook.users.length === 0 ? (
                        <div
                            style={{
                                width: '100%',
                                padding: 20,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 18,
                                    textAlign: 'center',
                                    fontFamily: 'Inter',
                                }}
                            >
                                No students.
                            </div>
                        </div>
                    ) : null}
                    {/* Enter no students message if there is none */}
                    {attendanceBookUsers.map((user: any, row: number) => {
                        const userTotals = instructorAttendanceBook.totals.find((x: any) => x.userId === user.userId);

                        return (
                            <tr style={{}} key={user.userId}>
                                {/* Student info */}
                                <th>
                                    <div>
                                        <img
                                            className="inline-block h-12 w-12 rounded-full"
                                            src={
                                                user.avatar
                                                    ? user.avatar
                                                    : 'https://cues-files.s3.amazonaws.com/images/default.png'
                                            }
                                            alt=""
                                        />

                                        <div className="mt-2 text-black dark:text-white text-sm">{user.fullName}</div>
                                    </div>
                                </th>
                                {/* Total */}
                                <td>
                                    <div className="flex flex-row items-center justify-center">
                                        <div className="text-sm text-black dark:text-white text-center ">
                                            {userTotals.totalPresent + ' / ' + userTotals.totalAttendancesPossible}
                                        </div>
                                    </div>
                                </td>
                                {/* Other scores */}
                                {attendanceBookEntries.map((entry: any, col: number) => {
                                    const userAttendance = entry.attendances.find((x: any) => x.userId === user.userId);

                                    // if (
                                    //     (activeModifyId === entry.dateId ||
                                    //         activeModifyId === entry.attendanceEntryId) &&
                                    //     activeUserId === user.userId
                                    // ) {
                                    //     return (
                                    //         <td key={col.toString()}>
                                    //             <View
                                    //                 style={{
                                    //                     flexDirection: 'column',
                                    //                     alignItems: 'center',
                                    //                 }}
                                    //             >
                                    //                 <View
                                    //                     style={{
                                    //                         width: '100%',
                                    //                         flexDirection: 'row',
                                    //                         justifyContent: 'center',
                                    //                         alignItems: 'center',
                                    //                         marginTop: 10,
                                    //                     }}
                                    //                 >
                                    //                     <View
                                    //                         style={{
                                    //                             flexDirection: 'column',
                                    //                             justifyContent: 'center',
                                    //                             alignItems: 'center',
                                    //                             marginRight: 20,
                                    //                         }}
                                    //                     >
                                    //                         <label style={{ width: '100%', maxWidth: 120 }}>
                                    //                             <Select
                                    //                                 themeVariant="light"
                                    //                                 selectMultiple={false}
                                    //                                 groupLabel="&nbsp;"
                                    //                                 inputClass="mobiscrollCustomMultiInput"
                                    //                                 placeholder="Select..."
                                    //                                 touchUi={true}
                                    //                                 value={attendanceEntry.attendanceType}
                                    //                                 data={attendanceTypeOptions}
                                    //                                 onChange={(val: any) => {
                                    //                                     const updateEntry = {
                                    //                                         ...attendanceEntry,
                                    //                                         attendanceType: val.value,
                                    //                                     };

                                    //                                     updateEntry.attendanceType = val.value;

                                    //                                     setAttendanceEntry(updateEntry);
                                    //                                 }}
                                    //                                 responsive={{
                                    //                                     small: {
                                    //                                         display: 'bubble',
                                    //                                     },
                                    //                                     medium: {
                                    //                                         touchUi: false,
                                    //                                     },
                                    //                                 }}
                                    //                             />
                                    //                         </label>
                                    //                         <View
                                    //                             style={{
                                    //                                 marginTop: 10,
                                    //                             }}
                                    //                         >
                                    //                             <View
                                    //                                 style={{
                                    //                                     flexDirection: 'row',
                                    //                                     alignItems: 'center',
                                    //                                 }}
                                    //                             >
                                    //                                 <Switch
                                    //                                     value={
                                    //                                         attendanceEntry.attendanceType ===
                                    //                                         'present'
                                    //                                             ? attendanceEntry.late
                                    //                                             : attendanceEntry.excused
                                    //                                     }
                                    //                                     onValueChange={() => {
                                    //                                         const updateEntry = {
                                    //                                             ...attendanceEntry,
                                    //                                         };

                                    //                                         if (
                                    //                                             attendanceEntry.attendanceType ===
                                    //                                             'present'
                                    //                                         ) {
                                    //                                             updateEntry.late =
                                    //                                                 !attendanceEntry.late;
                                    //                                         } else {
                                    //                                             updateEntry.excused =
                                    //                                                 !attendanceEntry.excused;
                                    //                                         }

                                    //                                         setAttendanceEntry(updateEntry);
                                    //                                     }}
                                    //                                     style={{ height: 20 }}
                                    //                                     trackColor={{
                                    //                                         false: '#f2f2f2',
                                    //                                         true: '#000',
                                    //                                     }}
                                    //                                     activeThumbColor="white"
                                    //                                 />
                                    //                                 <Text
                                    //                                     style={{
                                    //                                         paddingLeft: 10,
                                    //                                     }}
                                    //                                 >
                                    //                                     {attendanceEntry.attendanceType ===
                                    //                                     'present'
                                    //                                         ? 'Late'
                                    //                                         : 'Excused'}
                                    //                                 </Text>
                                    //                             </View>
                                    //                         </View>
                                    //                     </View>
                                    //                     <TouchableOpacity
                                    //                         onPress={() => {
                                    //                             updateAttendanceBookEntry();
                                    //                         }}
                                    //                         disabled={user.email === disableEmailId}
                                    //                     >
                                    //                         <Ionicons
                                    //                             name="checkmark-circle-outline"
                                    //                             size={20}
                                    //                             style={{ marginRight: 5 }}
                                    //                             color={'#8bc34a'}
                                    //                         />
                                    //                     </TouchableOpacity>
                                    //                     <TouchableOpacity
                                    //                         onPress={() => {
                                    //                             setActiveModifyId('');
                                    //                             setActiveModifyEntryType('');
                                    //                             setActiveUserId('');
                                    //                             setAttendanceEntry(undefined);
                                    //                             // setActiveScore('');
                                    //                         }}
                                    //                     >
                                    //                         <Ionicons
                                    //                             name="close-circle-outline"
                                    //                             size={20}
                                    //                             color={'#f94144'}
                                    //                         />
                                    //                     </TouchableOpacity>
                                    //                 </View>
                                    //             </View>
                                    //         </td>
                                    //     );
                                    // }

                                    return (
                                        <td>
                                            <button
                                                className="flex flex-col items-center justify-center w-full"
                                                key={row.toString() + '-' + col.toString()}
                                                // onPress={() => {
                                                //     setActiveModifyId(
                                                //         entry.dateId ? entry.dateId : entry.attendanceEntryId
                                                //     );
                                                //     setActiveModifyEntryType(
                                                //         entry.dateId ? 'meeting' : 'attendanceBook'
                                                //     );
                                                //     setActiveUserId(user.userId);
                                                //     setAttendanceEntry(
                                                //         userAttendance
                                                //             ? userAttendance
                                                //             : {
                                                //                   attendanceType: 'absent',
                                                //                   late: false,
                                                //                   excused: false,
                                                //               }
                                                //     );
                                                // }}
                                            >
                                                {userAttendance.attendanceType === 'present' ? (
                                                    <CheckIcon className="w-6 h-6 text-green-500" />
                                                ) : (
                                                    <XMarkIcon className="w-6 h-6 text-red-500" />
                                                )}

                                                {(userAttendance.attendanceType === 'present' && userAttendance.late) ||
                                                (userAttendance.attendanceType === 'absent' &&
                                                    userAttendance.excused) ? (
                                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-white">
                                                        {userAttendance.attendanceType === 'present' &&
                                                        userAttendance.late
                                                            ? 'LATE'
                                                            : 'EXCUSED'}
                                                    </div>
                                                ) : null}
                                            </button>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    const renderMainTabContent = () => {
        if (tab === 'Recordings') {
            return (
                <div className="">
                    {/* Section 1 Ongoing Experiences */}
                    <div className="flex h-16 flex-shrink-0 items-center border-b border-cues-border dark:border-cues-border-dark border-blue-gray-200 px-6">
                        <label htmlFor="search-field" className="sr-only">
                            Search
                        </label>
                        <div className="relative w-full text-black dark:text-white focus-within:text-gray-600">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                                <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <input
                                id="search-field"
                                className="block h-full w-full dark:bg-cues-dark-3 border-transparent py-2 pl-8 pr-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                                placeholder="Search by title, date or topic"
                                type="search"
                                name="search"
                            />
                        </div>
                        <button
                            type="button"
                            className="ml-1 text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-cues-dark-1 focus:outline-none rounded-lg text-sm p-2.5"
                            onClick={() => {
                                // setShowFilterPopup(true);
                            }}
                        >
                            <span className="sr-only">View Filter</span>
                            <AdjustmentsHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                    {/* LIST OF  */}
                    <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
                        {recordings.map((recording: any, recordingIndx: number) => {
                            return (
                                <button
                                    key={recordingIndx}
                                    className="group relative flex flex-col border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 hover:bg-gray-100 dark:hover:bg-cues-dark-1 px-6 py-5 shadow-sm rounded-md"
                                    onClick={() => {
                                        // openCourse(course._id);
                                    }}
                                >
                                    <div className="absolute bottom-4 right-4 bg-cues-blue hidden group-hover:block rounded-full p-3 shadow">
                                        <PlayIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex w-full">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {recording.title}
                                        </h3>
                                    </div>
                                    {recording.description && (
                                        <div className="text-left text-sm text-gray-900 dark:text-white line-clamp-2 mt-3">
                                            {recording.description}
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-gray-900 dark:text-gray-400">{recording.date}</div>

                                        {/* <button className="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-white bg-cues-blue rounded-lg hover:bg-blue-700 focus:outline-none">
                                            View Recording
                                        </button> */}
                                    </div>

                                    <div className="mt-4 flex items-center">
                                        <div className="text-gray-900 dark:text-gray-400 text-sm mr-3 mb-2">Topics</div>
                                        {recording.topics.map((topic: any) => {
                                            return (
                                                <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 mr-2 mb-2">
                                                    {topic}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (tab === 'Attendances') {
            return (
                <div className="mt-12">
                    {/* Section 1 Ongoing Experiences */}
                    {loadingAttendanceBookInstructor ? (
                        <div
                            className="py-4"
                            style={{
                                width: '100%',
                                flex: 1,
                                justifyContent: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <ActivityIndicator color={theme === 'light' ? '#1F1F1F' : '#fff'} />
                        </div>
                    ) : instructorAttendanceBookError ? (
                        <div className="flex flex-1 flex-col w-full items-center py-12">
                            <div className="text-center">
                                <SignalSlashIcon className="mx-auto h-16 w-16 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                                    Failed to fetch replies. Try again.
                                </h3>
                            </div>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                                    // onClick={() => loadSelectedThreadReplies()}
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="overflow-x-scroll w-full max-w-full  border border-cues-border dark:border-cues-border-dark rounded-md">
                                {renderInstructorView()}
                            </div>
                            {/* Attendance Analytics */}
                            <div className="mt-16 hidden sm:block mb-4">
                                <div className="w-full flex items-center justify-between border-b border-gray-200 dark:border-cues-border-dark px-4 sm:px-6 lg:mx-auto lg:px-8 py-3">
                                    <h3 className="ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                        Attendance Insights
                                    </h3>

                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <a
                                                href="#"
                                                className="inline-flex items-center p-2 text-xs font-medium uppercase rounded-lg text-gray-700 sm:text-sm hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                                            >
                                                Full Report
                                                <svg
                                                    className="ml-1 w-4 h-4 sm:w-5 sm:h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        stroke-linecap="round"
                                                        stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M9 5l7 7-7 7"
                                                    ></path>
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>{renderAttendanceCharts()}</div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="">
                {/* Section 1 Ongoing Experiences */}
                <h1 className="mt-12 ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Ongoing
                </h1>

                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
                    {ongoingMeetings.map((meeting: any, meetingIndx: number) => {
                        return (
                            <div
                                key={meetingIndx}
                                className="flex flex-col border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 px-6 py-5 shadow-sm rounded-md"
                                onClick={() => {
                                    // openCourse(course._id);
                                }}
                            >
                                <div className="flex w-full">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {meeting.title}
                                    </h3>
                                </div>
                                {meeting.description && (
                                    <div className="text-left text-sm text-gray-900 dark:text-white line-clamp-2 mt-3">
                                        {meeting.description}
                                    </div>
                                )}

                                <div className="w-full mt-4 bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                    <div
                                        className="h-1.5 rounded-full dark:bg-blue-500 bg-cues-blue"
                                        style={{
                                            width: (meetingIndx + 1) * 0.25 * 100,
                                        }}
                                    />
                                </div>

                                <div className="mt-4 text-gray-900 dark:text-gray-400">{meeting.date}</div>

                                <div className="flex mt-4 space-x-3">
                                    <button className="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-white bg-cues-blue rounded-lg hover:bg-blue-700 focus:outline-none">
                                        Join
                                    </button>
                                    <button className="inline-flex items-center py-2 px-4 text-sm font-medium text-center text-gray-900 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">
                                        Copy Invite
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Section 2 Upcoming meetings */}
                <h1 className="mt-12 ml-3 text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                    Upcoming
                </h1>

                <div className="mt-4 grid grid-cols-1 gap-4 md:gap-8 sm:grid-cols-2 md:grid-cols-3">
                    {upcomingMeetings.map((meeting: any, meetingIndx: number) => {
                        return (
                            <div
                                key={meetingIndx}
                                className="flex flex-col border border-cues-border dark:border-cues-border-dark bg-white dark:bg-cues-dark-3 px-6 py-5 shadow-sm rounded-md"
                                onClick={() => {
                                    // openCourse(course._id);
                                }}
                            >
                                <div className="flex w-full">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {meeting.title}
                                    </h3>
                                </div>
                                {meeting.description && (
                                    <div className="text-left text-sm text-gray-900 dark:text-white line-clamp-2 mt-3">
                                        {meeting.description}
                                    </div>
                                )}

                                <div className="mt-4 text-gray-900 dark:text-gray-400">{meeting.date}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full bg-white dark:bg-cues-dark-3">
            <div className="px-4 sm:px-6 lg:mx-auto lg:px-8">
                <div className="hidden sm:block mb-4 mt-6">
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
                                className="inline-flex items-center rounded-md border border-transparent bg-cues-blue px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                                // onClick={() => showAddEvent()}
                            >
                                <PlusIcon className="-ml-1 mr-3 h-4 w-4" aria-hidden="true" />
                                New
                            </button>
                        </div>
                    </div>
                </div>
                {/*  */}
                {renderMainTabContent()}
            </div>
        </div>
    );
};

export default Meeting;
