import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { TextInput as CustomTextInput } from './CustomTextInput'
import { Text, View } from './Themed';
import EquationEditor from 'equation-editor-react';
import TextareaAutosize from 'react-textarea-autosize';
import { RadioButton } from "./RadioButton";
import parser from 'html-react-parser';

import ReactPlayer from "react-player";
import { Ionicons } from "@expo/vector-icons";

const Quiz: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {

    const [problems] = useState<any[]>(props.problems)
    const [solutions, setSolutions] = useState<any[]>(props.solutions.solutions)
    const [problemScores, setProblemScores] = useState<any[]>(props.solutions.problemScores)
    const [problemComments, setProblemComments] = useState<any[]>(props.solutions.problemComments ? props.solutions.problemComments : [])
    const [totalPossible, setTotalPossible] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [percentage, setPercentage] = useState("");
    const [comment, setComment] = useState(props.comment ? props.comment : "");
    const [headers, setHeaders] = useState<any>(props.headers)


    useEffect(() => {

        setHeaders(props.headers);
        // setInstructions(props.instructions);

    }, [props.headers])


    useEffect(() => {
        let currentScore = 0;
        props.solutions.problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })
        setCurrentScore(currentScore);

        setSolutions(props.solutions.solutions)
        setProblemScores(props.solutions.problemScores)
        setProblemComments(props.solutions.problemComments ? props.solutions.problemComments : [])

        if (props.solutions.solutions && !props.solutions.problemComments) {
            let comments: any[] = [];

            props.solutions.solutions.forEach((sol: any) => comments.push(""));

            setProblemComments(comments);

        }
       

    }, [props.solutions])

    useEffect(() => {
        let total = 0;
        props.problems.forEach((problem: any) => {
            total += problem.points;
        })
        setTotalPossible(total);
    }, [props.problems])

    useEffect(() => {
        let currentScore = 0;
        problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })

        setCurrentScore(currentScore);

        if (totalPossible === 0) return;

        setPercentage(((currentScore / totalPossible) * 100).toFixed(2))

    }, [problemScores, totalPossible])

    const diff_seconds = (dt2: any, dt1: any) => {

        const diff = dt2.getTime() - dt1.getTime();

        const Seconds_from_T1_to_T2 = diff / 1000;
        return Math.abs(Seconds_from_T1_to_T2);
    };

    const renderAudioVideoPlayer = (url: string, type: string) => {
        return <ReactPlayer
        url={url}
        controls={true}
        width={"100%"}
        height={type === "mp3" || type === "wav" ? "75px" : "360px" }
        onContextMenu={(e: any) => e.preventDefault()}
        config={{
          file: { attributes: { controlsList: "nodownload" } },
        }}
      />
    }


    const renderAttemptHistory = () => {

        return (<View style={{ width: Dimensions.get('window').width < 1024 ? '100%' : '60%', marginTop: 40, marginBottom: 80 }}>
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 23, fontWeight: 'bold'  }}>
                    Attempt History
                </Text>
            </View>
            <View style={styles.row}>
                <View style={styles.col} />
                <View style={styles.col}>
                    <Text style={{ fontWeight: 'bold'}}>
                        Attempt
                    </Text>
                </View>
                <View style={styles.col}>
                    <Text style={{ fontWeight: 'bold'}}>
                        Time
                    </Text>
                </View>
                <View style={styles.col}>
                    <Text style={{ fontWeight: 'bold'}}>
                        Score
                    </Text>
                </View>
            </View>
            {
                props.attempts.map((attempt: any, index: number) => {

                    let duration = attempt.initiatedAt !== null ? diff_seconds(new Date(attempt.submittedAt), new Date(attempt.initiatedAt)) : 0

                    let hours = duration !== 0 ? Math.floor(duration / 3600) :  0;

                    let minutes = duration !== 0 ? Math.floor((duration - hours * 3600) / 60) : 0;

                    let seconds = duration !== 0 ?  Math.ceil(duration - (hours * 3600) - (minutes * 60)) : 0;

                    return (<View style={styles.row}>
                        <View style={styles.col}>
                            {attempt.isActive ? <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name='checkmark-outline' size={23} color={"#53BE68"} /> 
                                <Text style={{ fontSize: 17, paddingLeft: 5 }}>
                                    KEPT
                                </Text>
                            </View> : null}
                        </View> 
                        <View style={styles.col}>
                            {props.isOwner ? <TouchableOpacity onPress={() => props.onChangeQuizAttempt(index)}>
                                <Text style={{ color: '#3B64F8' }}>
                                    Attempt {index + 1}
                                </Text>
                            </TouchableOpacity> : <Text>
                                Attempt {index + 1}
                            </Text>}
                            
                        </View>
                        <View style={styles.col}>
                            {duration !== 0 ? `${hours !== 0 ? "" + hours + " H " : ""} ${minutes !== 0 ? "" + minutes + " min" : ""}  ${seconds !== 0 ? "" + seconds + " sec" : ""}` : "-"}
                        </View>
                        <View style={styles.col}>
                            {attempt.score} out of {totalPossible} 
                        </View>
                    </View>)
                })
            }

        </View>)
    }

    const renderHeader = (index: number) => {
        if (index in headers) {
            return (<Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 15, fontWeight: "600" }}>
                {headers[index]}
            </Text>)
        }
        return null;
    }

    let totalPoints = 0;

    problems.map((problem: any) => {
        totalPoints += Number(problem.points)
    })

    if (props.loading) return (<View
        style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white"
        }}>
        <ActivityIndicator color={"#a2a2ac"} />
    </View>)

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            paddingTop: 15,
            paddingLeft: 0,
            flexDirection: 'column',
            justifyContent: 'flex-start'
        }}>
            {
                props.isOwner ? <View style={{ display: 'flex', flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#cccccc", width: '100%' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', marginBottom: Dimensions.get('window').width < 1024 ? 20 : 0  }}>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                            {props.problems.length} {props.problems.length === 1 ? "Question" : "Questions"}
                        </Text>
                        <Text style={{ marginRight: 10, fontSize: 15}}>
                            |
                        </Text>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 15 }}>
                            {totalPossible} Points 
                        </Text>
                    </View>
                    

                    <View style={{ }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: "white",
                                    height: 22,
                                    paddingHorizontal: 10,
                                    borderRadius: 0,
                                    backgroundColor: "#007AFF",
                                    lineHeight: 20,
                                    paddingTop: 1
                                }}>
                                {percentage}%
                            </Text>
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: "white",
                                    height: 22,
                                    // textAlign: 'right',
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 0,
                                    backgroundColor: "#007AFF",
                                    lineHeight: 20,
                                    paddingTop: 1
                                }}>
                                {currentScore}/{totalPossible}
                            </Text>
                            {props.isOwner ? <Text style={{ fontSize: 15, color: "#1D1D20", marginBottom: 10, paddingLeft: 20, lineHeight: 22, textTransform: 'uppercase' }}>
                                {props.partiallyGraded ? "In progress" : "Graded"}
                            </Text> : null}
                        </View>

                    </View>
                </View> : null
            }

            {renderAttemptHistory()}

            {props.isOwner ? <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 23, fontWeight: 'bold'  }}>
                    Attempt {props.currentQuizAttempt + 1}
                </Text>
            </View> : null}
            


            {
                props.problems.map((problem: any, index: any) => {


                    let onlyOneCorrect = true;

                    if (!problem.questionType) {
                        let noOfCorrect = 0;

                        problem.options.map((option: any) => {
                            if (option.isCorrect) noOfCorrect++;
                        })

                        if (noOfCorrect > 1) onlyOneCorrect = false;
                    }

                    let audioVideoQuestion = problem.question[0] === "{"  && problem.question[problem.question.length - 1] === "}";

                    let url = "";
                    let content = "";
                    let type = "";

                    if (audioVideoQuestion) {
                        const parse = JSON.parse(problem.question);

                        url = parse.url;
                        content = parse.content;
                        type = parse.type;
                    }

                    return <View style={{ borderBottomColor: '#f8f8fa', borderBottomWidth: index === (props.problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        <View style={{ flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', width: '100%' }}>
                                <View style={{ flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', width: Dimensions.get('window').width > 768 ? '65%' : '100%' }}>
                                    <View style={{ flexDirection: 'row', paddingTop: 15, width: '100%' }}>
                                        <Text style={{ color: '#a2a2ac', fontSize: 15, paddingBottom: 25, marginRight: 10, paddingTop: 10 }}>
                                            {index + 1}.
                                        </Text>
                                        {
                                            problem.question && problem.question.includes("image:") ?
                                                (<Image
                                                    resizeMode={'contain'}
                                                    style={{
                                                        width: 400,
                                                        height: 400
                                                    }}
                                                    source={{
                                                        uri: problem.question.split("image:")[1]
                                                    }}
                                                />) :
                                                (
                                                    problem.question && problem.question.includes("formula:") ? (
                                                        <View style={{
                                                            borderColor: '#f0f0f2',
                                                            borderWidth: 1,
                                                            borderRadius: 15,
                                                            padding: 10,
                                                            width: '50%'
                                                        }}>
                                                            <EquationEditor
                                                                value={problem.question.split("formula:")[1]}
                                                                onChange={() => { return; }}
                                                                autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                                autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                            />
                                                        </View>
                                                    ) :
                                                    (audioVideoQuestion ? <View style={{ width: '80%', marginBottom: 10 }}>
                                                    {renderAudioVideoPlayer(url, type)}
                                                        <Text style={{ marginTop: 10, marginBottom: 20, marginLeft: 20, fontSize: 15, lineHeight: 25 }}>
                                                            {parser(content)}
                                                        </Text>
                                                    </View> : <Text style={{ marginTop: 10, marginBottom: 20, marginLeft: 20, fontSize: 15, width: '80%', lineHeight: 25 }}>
                                                        {parser(problem.question)}
                                                    </Text>)
                                                )
                                        }

                                    </View>
                                    
                                <View>  
                                
                            <View style={{ flexDirection: 'row', paddingLeft: Dimensions.get('window').width > 768 ? 20 : 0 }}>
                                {!props.isOwner ? null : <TextInput
                                    editable={props.isOwner ? true : false}
                                    value={problemScores[index]}
                                    onChange={(e: any) => {
                                        if (Number.isNaN(Number(e.target.value))) return
                                        const updateProblemScores = [...problemScores]
                                        updateProblemScores[index] = e.target.value;
                                        setProblemScores(updateProblemScores)
                                    }}
                                    style={{
                                        width: 120,
                                        borderBottomColor: '#f8f8fa',
                                        borderBottomWidth: 1,
                                        fontSize: 15,
                                        padding: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 5,
                                        marginBottom: 20,
                                        height: 40
                                    }}
                                    placeholder={'Enter points'}
                                    placeholderTextColor={'#a2a2ac'}
                                />}
                                {!props.isOwner ? null : <TextInput
                                    editable={false}
                                    value={"/ " + problem.points}
                                    style={{
                                        width: 100,
                                        fontSize: 15,
                                        padding: 15,
                                        paddingTop: 12,
                                        paddingBottom: 12,
                                        marginTop: 5,
                                        paddingRight: 30,
                                        marginBottom: 20,
                                        height: 40
                                    }}
                                    placeholder={'Enter points'}
                                    placeholderTextColor={'#a2a2ac'}
                                />}
                                {
                                    !props.isOwner ? <Text style={{ fontSize: 15, marginTop: 5, marginBottom: 20, paddingTop: 12, paddingRight: 30, textAlign: 'right' }}>
                                        {Number(problemScores[index]).toFixed(1)} / {Number(problem.points).toFixed(1)}
                                    </Text> : null
                                }

                                <View style={{ flexDirection: 'row' }}>
                                    {
                                        !problem.required ?
                                            (<Text style={{
                                                fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'left', paddingLeft: 35,
                                                paddingTop: Dimensions.get('window').width < 1024 ? 25 : 15
                                            }}>
                                                optional
                                            </Text>)
                                            : (<Text style={{
                                                fontSize: 11, color: '#a2a2ac', marginBottom: 20, textAlign: 'left', paddingLeft: 35,
                                                paddingTop: Dimensions.get('window').width < 1024 ? 25 : 15
                                            }}>
                                                required
                                            </Text>)
                                    }
                                </View>
                            </View>
                        </View>
                        </View>
                            
                    </View>

                        {
                            (!problem.questionType || problem.questionType === "trueFalse") && problem.options.map((option: any, i: any) => {

                                let color = '#1D1D20'
                                if (option.isCorrect) {
                                    color = '#007AFF'
                                } else if (!option.isCorrect && solutions[index].selected[i].isSelected) {
                                    color = '#f94144'
                                }

                                return <View style={{ flexDirection: 'row' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingLeft: 40, paddingRight: 10, paddingTop: 21 }}>
                                        {onlyOneCorrect ?
                                        <TouchableOpacity
                                            style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', }}
                                            disabled={true}
                                        >
                                            <RadioButton selected={solutions[index].selected[i].isSelected} />
                                        </TouchableOpacity>
                                        :
                                        <input
                                            disabled={true}
                                            style={{ paddingRight: 20 }}
                                            type='checkbox'
                                            checked={solutions[index].selected[i].isSelected}
                                        />}
                                    </View>
                                    {
                                        option.option && option.option.includes("image:") ?
                                            (<Image
                                                resizeMode={'contain'}
                                                style={{
                                                    width: 200,
                                                    height: 200
                                                }}
                                                source={{
                                                    uri: option.option.split("image:")[1]
                                                }}
                                            />) :
                                            (
                                                option.option && option.option.includes("formula:") ?
                                                    <View style={{
                                                        borderColor: '#f0f0f2',
                                                        borderWidth: 1,
                                                        borderRadius: 15,
                                                        padding: 10,
                                                        width: '30%'
                                                    }}>
                                                        <EquationEditor
                                                            value={option.option.split("formula:")[1]}
                                                            onChange={() => { return; }}
                                                            autoCommands="pi theta sqrt sum prod alpha beta gamma rho int"
                                                            autoOperatorNames="sin cos tan arccos arcsin arctan"
                                                        />
                                                    </View> :
                                                    <Text
                                                        style={{
                                                            width: Dimensions.get('window').width < 1024 ? '80%' : '50%',
                                                            fontSize: 15,
                                                            padding: 15,
                                                            paddingTop: 12,
                                                            paddingBottom: 12,
                                                            marginTop: 5,
                                                            marginBottom: 20,
                                                            color,
                                                            lineHeight: 25
                                                        }}
                                                    >
                                                        {option.option}
                                                    </Text>
                                            )
                                    }
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ?
                                <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                    <Text style={{ color: solutions[index].response !== "" ? '#818385' : '#f94144', paddingTop: 20, paddingBottom: 40, lineHeight: 20, borderBottomColor: '#e8e8ea', borderBottomWidth: 1 }}>
                                        {solutions[index].response && solutions[index].response !== "" ? solutions[index].response : "No response"}
                                    </Text>
                                </View>
                                :
                                null
                        }

                        {!props.isOwner && problemComments[index] === '' ? null : <View style={{ width: '80%', maxWidth: 400, marginLeft: 40 }}>
                            {props.isOwner ? <TextareaAutosize
                                value={problemComments[index]}
                                placeholder='Remark'
                                minRows={3}
                                style={{ 
                                    marginTop: 20,
                                    marginBottom: 20,
                                    fontSize: 15,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    width: '100%',
                                    maxWidth: "100%",
                                    borderBottom: '1px solid #cccccc',
                                }}
                                onChange={(e: any) => {
                                    const updateProblemComments = [...problemComments];
                                    updateProblemComments[index] = e.target.value;
                                    setProblemComments(updateProblemComments)
                                }}
                            /> :
                                <View style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40 }}>
                                    <Text style={{ color: '#007AFF', fontSize: 13, }}>
                                        {problemComments[index]}
                                    </Text>
                                </View>}
                        </View>}
                    </View>
                })
            }
            {!props.isOwner && !comment ? null : <View style={{ width: '100%', paddingVertical: 50, paddingHorizontal: 40, borderTopWidth: 1, borderColor: '#f0f0f2' }}>
                <Text style={{ width: '100%', textAlign: 'left' }}>
                    Feedback
                </Text>
                {props.isOwner ? <View style={{ width: '80%', maxWidth: 400 }}>
                    <TextareaAutosize
                        style={{ 
                            marginTop: 20,
                            marginBottom: 20,
                            fontSize: 15,
                            paddingTop: 12,
                            paddingBottom: 12,
                            width: '100%',
                            maxWidth: "100%",
                            borderBottom: '1px solid #cccccc',
                        }}
                        value={comment}
                        onChange={(e: any) => setComment(e.target.value)}
                        minRows={3}
                    />
                </View> :
                    <Text style={{ color: '#007AFF', fontSize: 15, width: '100%', textAlign: 'left', marginTop: 40 }}>
                        {comment}
                    </Text>
                }
            </View>}

            {/* Add Submit button here */}
            {props.isOwner ? <View
                style={{
                    flex: 1,
                    backgroundColor: 'white',
                    alignItems: 'center',
                    display: 'flex',
                    marginTop: 25,
                    marginBottom: 25,
                    paddingBottom: 100
                }}>

                {
                    props.isOwner && props.isV1Quiz  && props.currentQuizAttempt !== props.activeQuizAttempt ?
                    <TouchableOpacity
                    onPress={() => props.modifyActiveQuizAttempt()}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        overflow: 'hidden',
                        height: 35,
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            textAlign: 'center',
                            lineHeight: 35,
                            color: '#2f2f3c',
                            fontSize: 12,
                            backgroundColor: '#F8F9FA',
                            paddingHorizontal: 25,
                            fontFamily: 'inter',
                            height: 35,
                            width: 150

                        }}>
                            MAKE ACTIVE
                        </Text>
                    </TouchableOpacity> : null

                }
                <TouchableOpacity
                    onPress={() => props.onGradeQuiz(problemScores, problemComments, Number(percentage), comment)}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 15,
                        overflow: 'hidden',
                        height: 35,
                    }}>
                    <Text style={{
                        textAlign: 'center',
                        lineHeight: 35,
                        color: 'white',
                        fontSize: 12,
                        backgroundColor: '#007AFF',
                        paddingHorizontal: 25,
                        fontFamily: 'inter',
                        height: 35,
                        width: 150
                    }}>
                        SAVE
                    </Text>
                </TouchableOpacity>
            </View> : null}

           
        </View >
    );
}

export default Quiz;

const styles = StyleSheet.create({
    input: {
        width: '50%',
        // borderBottomColor: '#f8f8fa',
        // borderBottomWidth: 1,
        fontSize: 15,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    },
    row: { minHeight: 50, flexDirection: 'row', overflow: 'hidden', borderBottomColor: '#e0e0e0', borderBottomWidth: 1 },
    col: { width: "25%", justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, },
});
