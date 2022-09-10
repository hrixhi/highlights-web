// REACT
import { PlusIcon } from '@heroicons/react/20/solid';
import { ArrowTopRightOnSquareIcon, PencilSquareIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import { useAppContext } from '../contexts/AppContext';
import { useCourseContext } from '../contexts/CourseContext';
import { useNavigationContext } from '../contexts/NavigationContext';

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

    const renderInstructorView = () => {
        return (
            <table className="gradebookTable">
                {/* First row  */}
                <thead>
                    <tr>
                        {/* First cell will contain search bar */}
                        <th>
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
                                                style={{
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                }}
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
                                                    <div
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color: '#f94144',
                                                        }}
                                                    >
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
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 13,
                                                            color:
                                                                userScore && userScore.lateSubmission
                                                                    ? '#f3722c'
                                                                    : '#000000',
                                                        }}
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
                                                        style={{
                                                            textAlign: 'center',
                                                            fontSize: 11,
                                                            color: displayStatus === 'Late' ? '#f3722c' : '#f94144',
                                                            marginTop: 5,
                                                            borderWidth: 0,
                                                            borderRadius: 10,
                                                            alignSelf: 'center',
                                                        }}
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
                        {/* <div>{renderAttendanceCharts()}</div> */}
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

export default Grades;
