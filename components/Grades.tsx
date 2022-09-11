// REACT
import { PlusIcon } from '@heroicons/react/20/solid';
import { ArrowTopRightOnSquareIcon, ArrowUpIcon, PencilSquareIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { useCourseContext } from '../contexts/CourseContext';
import { useNavigationContext } from '../contexts/NavigationContext';

import Chart from 'react-apexcharts';

const Grades: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    const { userId, user } = useAppContext();

    const { theme } = useNavigationContext();

    const { grades } = useCourseContext();

    const {
        instructorGradebook,
        instructorGradebookError,
        gradebookEntries,
        gradebookUsers,
        courseStudents,
        loadingGradebookInstructor,
    } = grades;

    const [tab, setTab] = useState('Assignments');
    const viewGradebookTabs = ['Pts', '%'];
    const [gradebookViewPoints, setGradebookViewPoints] = useState(true);

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    const tabs = ['Assignments', 'Standards'];

    const renderAssignmentInsightsCharts = () => {
        // Table 1 - OVERALL DATA
        const insights = {
            status: 'Deadline Passed',
            deadline: 'Sep 1st, 11:59pm',
            gradeWeight: '10%',
            sharedWith: 20,
            submitted: 18,
            graded: 10,
        };

        const insightsLabels = {
            status: 'Status',
            deadline: 'Deadline',
            gradeWeight: 'Grade Weight',
            sharedWith: 'Shared With',
            submitted: 'Submitted',
            graded: 'Graded',
        };

        const performance = {
            totalPoints: 50,
            mean: 44,
            max: 47,
            min: 41,
            std: 2.5,
        };

        const performanceLabels = {
            totalPoints: 'Total Points',
            mean: 'Mean',
            max: 'Max',
            min: 'Min',
            std: 'Std Dev.',
        };

        // Chart 1 - SUBMISSION PROGRESS
        let progressChartColors = {};

        if (document.documentElement.classList.contains('dark')) {
            progressChartColors = {
                fillGradientShade: 'dark',
                fillGradientShadeIntensity: 0.45,
            };
        } else {
            progressChartColors = {
                fillGradientShade: 'light',
                fillGradientShadeIntensity: 1,
            };
        }

        const dummySubmissionProgressData = [
            {
                date: '20 Aug',
                pct: 20,
            },
            {
                date: '22 Aug',
                pct: 25,
            },
            {
                date: '24 Aug',
                pct: 35,
            },
            {
                date: '26 Aug',
                pct: 50,
            },
            {
                date: '26 Aug',
                pct: 55,
            },
            {
                date: '28 Aug',
                pct: 70,
            },
            {
                date: '1 Sep',
                pct: 90,
            },
        ];

        const series1 = dummySubmissionProgressData.map((data) => data.pct);
        const labels1 = dummySubmissionProgressData.map((data) => data.date);

        // Chart 2 - GRADING PROGRESS
        const dummyGradingProgressData = [
            {
                date: '1 Sep',
                pct: 20,
            },
            {
                date: '3 Sep',
                pct: 25,
            },
            {
                date: '5 Sep',
                pct: 35,
            },
            {
                date: '7 Sep',
                pct: 50,
            },
        ];

        const series2 = dummyGradingProgressData.map((data) => data.pct);
        const labels2 = dummyGradingProgressData.map((data) => data.date);

        const chart1Options = {
            series: [
                {
                    name: '% Submitted',
                    data: series1,
                },
            ],
            labels: labels1,
            chart: {
                height: '305px',
                fontFamily: 'Inter, sans-serif',
                sparkline: {
                    enabled: true,
                },
                toolbar: {
                    show: false,
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: progressChartColors.fillGradientShade,
                    shadeIntensity: progressChartColors.fillGradientShadeIntensity,
                },
            },
            plotOptions: {
                area: {
                    fillTo: 'end',
                },
            },
            theme: {
                monochrome: {
                    enabled: true,
                    color: '#1A56DB',
                },
            },
            tooltip: {
                style: {
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                },
            },
        };

        const chart2Options = {
            series: [
                {
                    name: '% Graded',
                    data: series2,
                },
            ],
            labels: labels2,
            chart: {
                height: '305px',
                fontFamily: 'Inter, sans-serif',
                sparkline: {
                    enabled: true,
                },
                toolbar: {
                    show: false,
                },
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: progressChartColors.fillGradientShade,
                    shadeIntensity: progressChartColors.fillGradientShadeIntensity,
                },
            },
            plotOptions: {
                area: {
                    fillTo: 'end',
                },
            },
            theme: {
                monochrome: {
                    enabled: true,
                    color: '#1A56DB',
                },
            },
            tooltip: {
                style: {
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                },
            },
        };

        //
        let signupsChartColors: any = {};

        if (document.documentElement.classList.contains('dark')) {
            signupsChartColors = {
                backgroundBarColors: ['#374151', '#374151', '#374151', '#374151', '#374151'],
            };
        } else {
            signupsChartColors = {
                backgroundBarColors: ['#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB', '#E5E7EB'],
            };
        }

        const topPerformers = [
            { x: 'Alex Jones', y: 47 },
            { x: 'Liam Richardson', y: 45 },
            { x: 'Katy Perry', y: 44 },
            { x: 'Emma Avery', y: 44 },
            { x: 'Avery Johnson', y: 43 },
        ];

        const labels3 = Object.keys(topPerformers).map((performer: any) => {
            return topPerformers[performer].x;
        });

        const series3 = Object.keys(topPerformers).map((performer: any) => {
            return topPerformers[performer].y;
        });

        const chart3Options = {
            series: [
                {
                    name: 'Top performers',
                    data: series3,
                },
            ],
            labels: labels3,
            chart: {
                type: 'bar',
                height: '305px',
                foreColor: '#4B5563',
                fontFamily: 'Inter, sans-serif',
                toolbar: {
                    show: false,
                },
            },
            theme: {
                monochrome: {
                    enabled: true,
                    color: '#1A56DB',
                },
            },
            plotOptions: {
                bar: {
                    columnWidth: '25%',
                    borderRadius: 3,
                    colors: {
                        backgroundBarColors: signupsChartColors.backgroundBarColors,
                        backgroundBarRadius: 3,
                    },
                },
                dataLabels: {
                    hideOverflowingLabels: false,
                },
            },
            xaxis: {
                floating: true,
                labels: {
                    show: false,
                },
                axisBorder: {
                    show: false,
                },
                axisTicks: {
                    show: false,
                },
            },
            tooltip: {
                shared: true,
                intersect: false,
                style: {
                    fontSize: '14px',
                    fontFamily: 'Inter, sans-serif',
                },
            },
            states: {
                hover: {
                    filter: {
                        type: 'darken',
                        value: 0.8,
                    },
                },
            },
            fill: {
                opacity: 1,
            },
            yaxis: {
                show: false,
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

        // Chart 2 - LOWEST AND HIGHEST SCORES
        return (
            <div className="flex flex-col w-full mt-4">
                {/* 2 Tables */}
                <div className="grid gap-8 sm:grid-cols-2">
                    {/* Table 1 */}
                    <div className="p-4 mb-4 h-full bg-white rounded-lg shadow sm:p-6 dark:bg-cues-dark-3 border border-cues-border dark:border-cues-border-dark">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-xl font-bold leading-none text-gray-900 dark:text-white">Stats</div>
                            <button className="inline-flex items-center p-2 text-sm font-medium rounded-lg text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                                View All
                            </button>
                        </div>
                        <ul className="divide-y divide-cues-divide dark:divide-cues-divide-dark list-none">
                            {Object.keys(insights).map((insight: any) => {
                                return (
                                    <li className="py-3 sm:py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="inline-flex items-center text-md font-medium text-gray-700 dark:text-gray-400 capitalize">
                                                    {insightsLabels[insight]}
                                                </h3>
                                            </div>
                                            <h3 className="inline-flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                                                {insights[insight].toString()}
                                            </h3>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    {/* Table 2 */}
                    <div className="p-4 mb-4 h-full bg-white rounded-lg shadow sm:p-6 dark:bg-cues-dark-3 border border-cues-border dark:border-cues-border-dark">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-xl font-bold leading-none text-gray-900 dark:text-white">
                                Performance
                            </div>
                            <button className="inline-flex items-center p-2 text-sm font-medium rounded-lg text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                                View All
                            </button>
                        </div>
                        <ul className="divide-y divide-cues-divide dark:divide-cues-divide-dark list-none">
                            {Object.keys(performance).map((per: any) => {
                                return (
                                    <li className="py-3 sm:py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="inline-flex items-center text-md font-medium text-gray-700 dark:text-gray-400 capitalize">
                                                    {performanceLabels[per]}
                                                </h3>
                                            </div>
                                            <h3 className="inline-flex items-center text-xl font-semibold text-gray-900 dark:text-white">
                                                {performance[per].toString()}
                                            </h3>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
                {/* 3 Charts */}
                <div className="grid grid-cols-1 gap-4 mt-8 w-full md:grid-cols-2 xl:grid-cols-3">
                    {/* Chart 1 */}
                    <div className="p-4 bg-white rounded-lg shadow sm:p-6 xl:p-8 dark:bg-cues-dark-3 border border-cues-border dark:border-cues-border-dark">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="text-2xl font-bold leading-none text-gray-900 sm:text-3xl dark:text-white">
                                    90%
                                </div>
                                <div className="text-base font-normal text-gray-500 dark:text-gray-400">Submitted</div>
                            </div>
                            <div className="flex flex-1 justify-end items-center ml-5 w-0 text-base font-bold text-green-500 dark:text-green-400">
                                3.2%
                                <ArrowUpIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <Chart
                            options={chart1Options}
                            series={[
                                {
                                    name: '% Submitted',
                                    data: series1,
                                },
                            ]}
                            type="area"
                            width={350}
                            height={305}
                        />
                    </div>
                    {/* Chart 2 */}
                    <div className="p-4 bg-white rounded-lg shadow sm:p-6 xl:p-8 dark:bg-cues-dark-3 border border-cues-border dark:border-cues-border-dark">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="text-2xl font-bold leading-none text-gray-900 sm:text-3xl dark:text-white">
                                    50%
                                </div>
                                <div className="text-base font-normal text-gray-500 dark:text-gray-400">Graded</div>
                            </div>
                            <div className="flex flex-1 justify-end items-center ml-5 w-0 text-base font-bold text-green-500 dark:text-green-400">
                                8%
                                <ArrowUpIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <Chart
                            options={chart2Options}
                            series={[
                                {
                                    name: '% Graded',
                                    data: series2,
                                },
                            ]}
                            type="area"
                            width={350}
                            height={305}
                        />
                    </div>
                    {/* Chart 3 */}
                    <div className="p-4 bg-white rounded-lg shadow sm:p-6 xl:p-8 dark:bg-cues-dark-3 border border-cues-border dark:border-cues-border-dark">
                        {/* <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700"> */}
                        <ul className="list-none flex flex-wrap -mb-px">
                            <li className="mr-2">
                                <a
                                    href="#"
                                    className="inline-block p-3 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500"
                                >
                                    Highest scores
                                </a>
                            </li>
                            <li className="mr-2">
                                <a
                                    href="#"
                                    className="inline-block p-3 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 dark:text-white  hover:border-gray-300 dark:hover:text-gray-300"
                                    aria-current="page"
                                >
                                    Lowest
                                </a>
                            </li>
                        </ul>
                        {/* </div> */}
                        <Chart
                            options={chart3Options}
                            series={[
                                {
                                    name: 'Highest Performers',
                                    data: series3,
                                },
                            ]}
                            type="bar"
                            width={350}
                            height={305}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderInstructorView = () => {
        return (
            <table className="gradebookTable">
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
                        {gradebookEntries.map((entry: any, col: number) => {
                            return (
                                <th
                                    // onClick={() => {
                                    //     if (entry.cueId) {
                                    //         props.openCueFromGrades(
                                    //             props.channelId,
                                    //             entry.cueId,
                                    //             props.channelCreatedBy
                                    //         );
                                    //     } else {
                                    //         handleEditGradebookEntry(entry.gradebookEntryId);
                                    //     }
                                    // }}
                                    style={{
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <div className="w-full flex justify-center items-center">
                                            <div className="text-gray-900 dark:text-gray-400 text-xs mr-2">
                                                {new Date(entry.deadline).toString().split(' ')[1] +
                                                    ' ' +
                                                    new Date(entry.deadline).toString().split(' ')[2]}{' '}
                                            </div>
                                            <div className="text-gray-900 dark:text-gray-400 text-center text-sm mr-2">
                                                {'•'}
                                            </div>

                                            <div className="text-gray-900 dark:text-gray-400 text-center text-xs">
                                                {entry.gradeWeight}
                                                {'%'}
                                            </div>
                                        </div>
                                        <div className="line-clamp-2 truncate mt-2 text-center">{entry.title}</div>

                                        <div className="text-gray-900 dark:text-gray-400 w-full mt-2 flex justify-center">
                                            {entry.cueId ? (
                                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                            ) : (
                                                <PencilSquareIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                {/* Footer */}
                <tfoot>
                    <tr>
                        {/* First cell will contain search bar */}
                        <th></th>
                        {/* Total column */}
                        <th></th>
                        {/* All assignments */}
                        {gradebookEntries.map((entry: any, col: number) => {
                            return (
                                <th>
                                    <div
                                        className="w-full flex justify-center"
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        {entry.releaseSubmission ? (
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-200 py-1 px-2.5 text-xs font-medium text-cues-blue"
                                            >
                                                Released
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-200 py-1 px-2.5 text-xs font-medium text-cues-blue"
                                            >
                                                Unreleased
                                            </button>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </tfoot>
                {/* Main Body */}
                <tbody>
                    {instructorGradebook.users.length === 0 ? (
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
                    {gradebookUsers.map((user: any, row: number) => {
                        const userTotals = instructorGradebook.totals.find((x: any) => x.userId === user.userId);

                        let total;

                        if (!userTotals) {
                            total = gradebookViewPoints ? '0 / 0' : '0%';
                        } else {
                            total = gradebookViewPoints
                                ? userTotals.pointsScored.toFixed(2).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1') +
                                  ' / ' +
                                  userTotals.totalPointsPossible
                                : userTotals.score.toFixed(2).replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1') + '%';
                        }

                        let gradingScaleOutcome;

                        if (userTotals) {
                            gradingScaleOutcome = userTotals.gradingScaleOutcome
                                ? '(' + userTotals.gradingScaleOutcome + ')'
                                : null;
                        }

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
                                        <div className="text-sm text-black dark:text-white text-center ">{total}</div>
                                        {gradingScaleOutcome ? (
                                            <div
                                                style={{
                                                    marginLeft: 5,
                                                }}
                                            >
                                                ({gradingScaleOutcome})
                                            </div>
                                        ) : null}
                                    </div>
                                </td>
                                {/* Other scores */}
                                {gradebookEntries.map((entry: any, col: number) => {
                                    const userScore = entry.scores.find((x: any) => x.userId === user.userId);

                                    const deadlinePassed = new Date() > new Date(entry.deadline);

                                    const displayStatus = !userScore
                                        ? undefined
                                        : !userScore.submitted &&
                                          userScore.score !== undefined &&
                                          userScore.score !== null
                                        ? 'Missing'
                                        : userScore.submitted && userScore.lateSubmission
                                        ? 'Late'
                                        : undefined;

                                    // if (
                                    //     (activeModifyId === entry.cueId || activeModifyId === entry.gradebookEntryId) &&
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
                                    //                 <Text
                                    //                     style={{
                                    //                         fontSize: 11,
                                    //                         marginBottom: 4,
                                    //                     }}
                                    //                 >
                                    //                     Points out of {entry.totalPoints}
                                    //                 </Text>

                                    //                 <View
                                    //                     style={{
                                    //                         width: '100%',
                                    //                         flexDirection: 'row',
                                    //                         justifyContent: 'center',
                                    //                         alignItems: 'center',
                                    //                     }}
                                    //                 >
                                    //                     <TextInput
                                    //                         value={activeScore}
                                    //                         placeholder={` / ${entry.totalPoints}`}
                                    //                         onChangeText={(val) => {
                                    //                             setActiveScore(val);
                                    //                         }}
                                    //                         keyboardType="numeric"
                                    //                         style={{
                                    //                             width: '50%',
                                    //                             marginRight: 5,
                                    //                             padding: 8,
                                    //                             borderBottomColor: '#f2f2f2',
                                    //                             borderBottomWidth: 1,
                                    //                             fontSize: 14,
                                    //                         }}
                                    //                         placeholderTextColor={'#1F1F1F'}
                                    //                     />
                                    //                     <TouchableOpacity
                                    //                         onPress={() => {
                                    //                             handleUpdateAssignmentScore(entry.totalPoints);
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
                                    //                             setActiveScore('');
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
                                                className="w-full flex flex-col justify-center items-center"
                                                key={row.toString() + '-' + col.toString()}
                                                disabled={!userScore || !deadlinePassed}
                                                // onPress={() => {
                                                //     setActiveModifyId(
                                                //         entry.cueId ? entry.cueId : entry.gradebookEntryId
                                                //     );
                                                //     setActiveModifyEntryType(entry.cueId ? 'cue' : 'gradebook');
                                                //     setActiveUserId(user.userId);
                                                //     setActiveScore(
                                                //         userScore && userScore.pointsScored
                                                //             ? userScore.pointsScored.toString()
                                                //             : ''
                                                //     );
                                                // }}
                                            >
                                                {!userScore || !userScore.submitted || !userScore.graded ? (
                                                    <div className="text-[#f94144] text-center text-sm">
                                                        {!userScore
                                                            ? 'N/A'
                                                            : userScore.score !== undefined && userScore.score !== null
                                                            ? gradebookViewPoints
                                                                ? userScore.pointsScored + ' / ' + entry.totalPoints
                                                                : userScore.score + '%'
                                                            : 'Not Submitted'}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={classNames(
                                                            userScore && userScore.lateSubmission
                                                                ? 'text-[#f3722c]'
                                                                : 'text-black dark:text-white',
                                                            'text-sm text-center'
                                                        )}
                                                    >
                                                        {userScore.score !== undefined && userScore.score !== null
                                                            ? gradebookViewPoints
                                                                ? userScore.pointsScored + ' / ' + entry.totalPoints
                                                                : userScore.score + '%'
                                                            : userScore.lateSubmission
                                                            ? 'Late'
                                                            : 'Submitted'}
                                                    </div>
                                                )}

                                                {displayStatus ? (
                                                    <div
                                                        className={classNames(
                                                            displayStatus === 'Late'
                                                                ? 'text-[#f3722x]'
                                                                : 'text-[#f94144]',
                                                            'mt-3 text-center text-xs rounded-sm'
                                                        )}
                                                    >
                                                        ({displayStatus})
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
        return (
            <div className="mt-12">
                {/* Section 1 Ongoing Experiences */}
                {loadingGradebookInstructor ? (
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
                ) : instructorGradebookError ? (
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
                                    Assignment Insights
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

                        <div className="mt-2 ml-12 flex items-center">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:leading-9">
                                Quiz 4
                            </h1>
                            <div className="ml-3 text-center text-xs text-gray-500 rounded-lg hover:text-gray-900 dark:text-gray-400">
                                Change
                            </div>
                        </div>

                        <div>{renderAssignmentInsightsCharts()}</div>
                    </div>
                )}
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
                            <div className="flex items-center mr-6 ">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">Pts</span>
                                <div>
                                    <label
                                        htmlFor="toggle-example"
                                        className="relative flex items-center mx-2 cursor-pointer"
                                    >
                                        <input type="checkbox" id="toggle-example" className="sr-only" />
                                        <div className="h-6 bg-gray-200 border border-gray-200 rounded-full toggle-bg w-11 dark:bg-gray-700 dark:border-gray-600"></div>
                                    </label>
                                </div>
                                <span className="font-medium text-gray-500 dark:text-gray-400 text-sm">%</span>
                            </div>
                            <div className="flex items-center ">
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
                </div>
                {/*  */}
                {renderMainTabContent()}
            </div>
        </div>
    );
};

export default Grades;
