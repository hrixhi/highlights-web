import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
// import { TextInput as CustomTextInput } from './CustomTextInput'
import { Text, View } from './Themed';
// import EquationEditor from 'equation-editor-react';
import TextareaAutosize from 'react-textarea-autosize';
import { RadioButton } from "./RadioButton";
import parser from 'html-react-parser';

import ReactPlayer from "react-player";
import { Ionicons } from "@expo/vector-icons";

import ImageMarker from "react-image-marker"

import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';

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

    if (!props.solutions) {
        return null;
    }

    // HOOKS

    /**
     * @description Set headers from Props
     */
    useEffect(() => {
        setHeaders(props.headers);
    }, [props.headers])


    /**
     * @description Loads Scores and Comments from props
     */
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

    /**
     * @description Calculates total possible score for quiz
     */
    useEffect(() => {
        let total = 0;
        props.problems.forEach((problem: any) => {
            total += problem.points;
        })
        setTotalPossible(total);
    }, [props.problems])

    /**
     * @description Sets current score and calculates percentage
     */
    useEffect(() => {
        let currentScore = 0;
        problemScores.forEach((score: any) => {
            currentScore += Number(score)
        })

        setCurrentScore(currentScore);

        if (totalPossible === 0) return;

        setPercentage(((currentScore / totalPossible) * 100).toFixed(2))

    }, [problemScores, totalPossible])

    // FUNCTIONS 

    /**
     * @description Helper method to calculate time difference between two times
     */
    const diff_seconds = (dt2: any, dt1: any) => {

        const diff = dt2.getTime() - dt1.getTime();

        const Seconds_from_T1_to_T2 = diff / 1000;
        return Math.abs(Seconds_from_T1_to_T2);
    };

    /**
     * @description Renders Audio/Video player
     */
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

    /**
     * @description Renders Attempt history for Quiz
     */
    const renderAttemptHistory = () => {

        return (<View style={{ width: Dimensions.get('window').width < 1024 ? '100%' : '60%', marginTop: 40, marginBottom: 80 }}>
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold'  }}>
                    Attempt History
                </Text>
            </View>
            <View style={styles.row}>
                <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }} />
                <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                    <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold'}}>
                        Attempt
                    </Text>
                </View>
                <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                    <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold'}}>
                        Time
                    </Text>
                </View>
                <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                    <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold'}}>
                        Score
                    </Text>
                </View>
                {
                    props.isOwner ?
                    <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                        <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, fontWeight: 'bold'}}>
                            Status
                        </Text>
                    </View> : null
                }
            </View>
            {
                props.attempts.map((attempt: any, index: number) => {

                    let duration = attempt.initiatedAt !== null ? diff_seconds(new Date(attempt.submittedAt), new Date(attempt.initiatedAt)) : 0

                    let hours = duration !== 0 ? Math.floor(duration / 3600) :  0;

                    let minutes = duration !== 0 ? Math.floor((duration - hours * 3600) / 60) : 0;

                    let seconds = duration !== 0 ?  Math.ceil(duration - (hours * 3600) - (minutes * 60)) : 0;

                    return (<View style={styles.row}>
                        <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                            {attempt.isActive ? <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name='checkmark-outline' size={Dimensions.get('window').width < 768 ? 23 : 18} color={"#53BE68"} /> 
                                <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, paddingLeft: 5 }}>
                                    KEPT
                                </Text>
                            </View> : null}
                        </View> 
                        <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                            {props.isOwner ? <TouchableOpacity onPress={() => props.onChangeQuizAttempt(index)}>
                                <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, color: '#3B64F8' }}>
                                    Attempt {index + 1}
                                </Text>
                            </TouchableOpacity> : <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, }}>
                                Attempt {index + 1}
                            </Text>}
                            
                        </View>
                        <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                            <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, }}>
                                {duration !== 0 ? `${hours !== 0 ? "" + hours + " H " : ""} ${minutes !== 0 ? "" + minutes + " min" : ""}  ${seconds !== 0 ? "" + seconds + " sec" : ""}` : "-"}
                            </Text>
                        </View>
                        <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                            <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, }}>
                                {attempt.score} / {totalPossible} 
                            </Text>
                        </View>
                        {
                            props.isOwner ? 
                            <View style={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, width: props.isOwner ? "20%" : "25%" }}>
                                <Text style={{ fontSize: Dimensions.get('window').width < 768 ? 13 : 14, }}>
                                    {attempt.isFullyGraded ? "Graded" : "Not Graded"} 
                                </Text>
                            </View>
                            : null
                        }

                    </View>)
                })
            }

        </View>)
    }

    /**
     * @description Renders Header for question at index
     */
    const renderHeader = (index: number) => {
        if (index in headers) {
            return (<Text style={{ width: '100%', marginBottom: 30, marginTop: 70, fontSize: 14, fontWeight: "600" }}>
                {headers[index]}
            </Text>)
        }
        return null;
    }

    if (props.loading) return (<View
        style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "white"
        }}>
        <ActivityIndicator color={"#1F1F1F"} />
    </View>)

    console.log("Solutions", solutions)

    // MAIN RETURN
    
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
                props.isOwner ? <View style={{ display: 'flex', flexDirection: Dimensions.get('window').width < 1024 ? 'column' : 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#f2f2f2", width: '100%' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', marginBottom: Dimensions.get('window').width < 1024 ? 20 : 0  }}>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 14 }}>
                            {props.problems.length} {props.problems.length === 1 ? "Question" : "Questions"}
                        </Text>
                        <Text style={{ marginRight: 10, fontWeight: '700', fontSize: 14 }}>
                            {totalPossible} Points 
                        </Text>
                    </View>
                    

                    <View style={{ }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    height: 22,
                                    fontFamily: 'Inter',
                                    paddingHorizontal: 10,
                                    borderRadius: 1,
                                    color: "#006AFF",
                                    lineHeight: 20,
                                    paddingTop: 1
                                }}>
                                {percentage}%
                            </Text>
                            <Text
                                style={{
                                    fontSize: 14,
                                    height: 22,
                                    fontFamily: 'Inter',
                                    // textAlign: 'right',
                                    paddingHorizontal: 10,
                                    marginLeft: 10,
                                    borderRadius: 1,
                                    color: "#006AFF",
                                    lineHeight: 20,
                                    paddingTop: 1
                                }}>
                                {currentScore}/{totalPossible}
                            </Text>
                            {props.isOwner ? <Text style={{ fontSize: 14, color: "#000000", marginBottom: 10, paddingLeft: 20, lineHeight: 22, textTransform: 'uppercase' }}>
                                {props.partiallyGraded ? "In progress" : "Graded"}
                            </Text> : null}
                        </View>

                    </View>
                </View> : null
            }

            {renderAttemptHistory()}

            {props.isOwner ? <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold'  }}>
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

                    return <View style={{ borderBottomColor: '#f2f2f2', borderBottomWidth: index === (props.problems.length - 1) ? 0 : 1, marginBottom: 25 }} key={index}>
                        {renderHeader(index)}
                        <View style={{ flexDirection: 'column', width: '100%' }}>
                                <View style={{  flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', width: '100%' }}>
                                    <Text style={{ color: '#000000', fontSize: 22, paddingBottom: 25, width: 40, paddingTop: 15, fontFamily: 'inter' }}>
                                        {index + 1}.
                                    </Text>

                                    {/* Question */}
                                    <View style={{ flexDirection: Dimensions.get('window').width < 768 ? 'column' : 'row', flex: 1 }}>

                                    {
                                        (audioVideoQuestion ? <View style={{ width: '100%', marginBottom: 10, paddingTop: 10, flex: 1 }}>
                                                {renderAudioVideoPlayer(url, type)}
                                                <Text style={{ marginTop: 10, marginBottom: 20, marginLeft: 20, fontSize: 14, lineHeight: 25 }}>
                                                    {parser(content)}
                                                </Text>
                                            </View> : <Text style={{ marginTop: 15, marginBottom: 20, marginLeft: 20, fontSize: 14, width: window.screen.width < 1024 ? '100%' : '80%' , lineHeight: 25, flex: 1 }}>
                                                {parser(problem.question)}
                                            </Text>)
                                    }
                                    
                                       

                                       {/* Scoring */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingLeft: Dimensions.get('window').width > 768 ? 20 : 0, marginBottom: Dimensions.get('window').width > 768 ? 20 : 0, marginLeft: 'auto', paddingTop: 7 }}>
                                            <View style={{ flexDirection: 'row', marginRight: 20 }}>
                                                {
                                                    !problem.required ?
                                                    (null)
                                                        : 
                                                        (<Text style={{ fontSize: 20, fontFamily: 'inter', color: 'black', marginBottom: 5, marginRight: 10, paddingTop: 10 }}>
                                                        *
                                                    </Text>)
                                                }
                                            </View>
                                            {!props.isOwner ? null : <TextInput
                                                editable={props.isOwner ? true : false}
                                                value={problemScores[index]}
                                                onChange={(e: any) => {
                                                    if (Number.isNaN(Number(e.target.value))) return
                                                    const updateProblemScores = [...problemScores]
                                                    updateProblemScores[index] = e.target.value;
                                                    if (Number(e.target.value) > Number(problem.points)) {
                                                        alert('Assigned score exceeds total points')
                                                    }
                                                    setProblemScores(updateProblemScores)
                                                }}
                                                style={{
                                                    width: 120,
                                                    borderBottomColor: '#f2f2f2',
                                                    borderBottomWidth: 1,
                                                    fontSize: 14,
                                                    padding: 15,
                                                    paddingTop: props.isOwner ? 12 : 7,
                                                    paddingBottom: 12,
                                                    // marginTop: 5,
                                                    height: 40
                                                }}
                                                placeholder={'Enter points'}
                                                placeholderTextColor={'#1F1F1F'}
                                            />}
                                            {!props.isOwner ? null : <TextInput
                                                editable={false}
                                                value={"/ " + problem.points}
                                                style={{
                                                    width: 100,
                                                    fontSize: 14,
                                                    padding: 15,
                                                    paddingTop: props.isOwner ? 12 : 7,
                                                    paddingBottom: 12,
                                                    // marginTop: 5,
                                                    paddingRight: 30,
                                                    height: 40
                                                }}
                                                placeholder={'Enter points'}
                                                placeholderTextColor={'#1F1F1F'}
                                            />}
                                            {
                                                !props.isOwner ? <Text style={{ fontSize: 16, marginTop: 5, marginBottom: 10, paddingTop: props.isOwner ? 12 : 7, paddingRight: 30, textAlign: 'right', fontFamily: "Inter" }}>
                                                    {Number(problemScores[index]).toFixed(1).replace(/\.0+$/,'')} / {Number(problem.points).toFixed(1).replace(/\.0+$/,'')}
                                                </Text> : null
                                            }

                                            
                                            </View>
                                        <View/>
                                    </View>
                                </View>

                                
                            
                            </View>

                        {
                            (!problem.questionType || problem.questionType === "trueFalse") && problem.options.map((option: any, i: any) => {

                                let color = '#000000'
                                if (option.isCorrect) {
                                    color = '#006AFF'
                                } else if (!option.isCorrect && solutions[index].selected[i].isSelected) {
                                    color = '#f94144'
                                }

                                return <View style={{ flexDirection: 'row' }} key={solutions.toString() + i.toString()}>
                                    <View style={{ paddingRight: 10, paddingTop: 21 }}>
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

                                    <Text
                                        style={{
                                            width: Dimensions.get('window').width < 1024 ? '80%' : '50%',
                                            fontSize: 14,
                                            paddingHorizontal: 15,
                                            // paddingTop: 12,
                                            // paddingBottom: 12,
                                            marginTop: 15,
                                            marginBottom: 20,
                                            color,
                                            lineHeight: 25
                                        }}
                                    >
                                        {parser(option.option)}
                                    </Text>
                                </View>
                            })
                        }
                        {
                            problem.questionType === "freeResponse" ?
                                <View style={{ width: '100%', paddingHorizontal: 40 }}>
                                    <Text style={{ color: solutions[index].response !== "" ? 'black' : '#f94144', paddingTop: 20, paddingBottom: 40, lineHeight: 25, borderBottomColor: '#f2f2f2', borderBottomWidth: 1 }}>
                                        {solutions[index].response && solutions[index].response !== "" ? parser(solutions[index].response) : "No response"}
                                    </Text>
                                </View>
                                :
                                null
                        }

{   
                            problem.questionType === 'highlightText' && props.isOwner ? <View style={{ paddingTop: 20 }}>
                                {ReactHtmlParser(problem.highlightTextHtml, {
                                    transform: (node: any, ind1: any) => {
                                        if (node.type === 'tag' && node.name === 'p') {

                                            node.attribs.style = 'line-height: 40px'

                                            const highlightTextHtml = problem.highlightTextHtml
                                            const highlightTextChoices = problem.highlightTextChoices
                                            const highlightTextSelection = solutions[index].highlightTextSelection

                                            console.log("solutions", solutions[index])

                                            var el = document.createElement('html');
                                            el.innerHTML = highlightTextHtml;
                                            const spans: HTMLCollection = el.getElementsByTagName('span')

                                            return convertNodeToElement(node, ind1, (node: any, ind2: any) => {
                                                if (node.type === 'tag' && node.name === 'span') {

                                                    let matchIndex = -1; 

                                                    // Loop over all the 
                                                    Array.from(spans).map((elm: any, ind3: number) => {
                                                        if (node.next.data === elm.nextSibling.data && node.prev.data === elm.previousSibling.data && node.children[0].data === elm.firstChild.data) {
                                                            matchIndex = ind3;
                                                        }
                                                    })

                                                    let classNameHighlight = 'highlightTextOption';

                                                    if (highlightTextSelection[matchIndex] && !highlightTextChoices[matchIndex]) {
                                                        classNameHighlight = 'highlightTextWrong'
                                                    } else if (highlightTextSelection[matchIndex] && highlightTextChoices[matchIndex]) {
                                                        classNameHighlight = 'highlightTextCorrect'
                                                    } else if (!highlightTextSelection[matchIndex] && highlightTextChoices[matchIndex]) {
                                                        classNameHighlight = 'highlightTextActive'
                                                    } 

        
                                                    return <span className={classNameHighlight}>{node.children[0].data}</span>;
                                                }
                                            });
                                        }

                                    } 
                                })}
                            </View> : null
                        }
                        
                        {
                            problem.questionType === 'dragdrop' ?
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    overflow: 'scroll',
                                    marginTop: 50
                                }}>
                                    {problem.dragDropHeaders.map((header: string, groupIndex: number) => {
                                        // 
                                        return (<View style={{ width: 200, marginRight: 20, padding: 20, backgroundColor: '#f2f2f2', }}>
                                            <Text style={{
                                                fontSize: 16,
                                                width: '100%',
                                                textAlign: 'center',
                                                marginBottom: 20,    
                                                fontFamily: 'Inter'           
                                            }}>
                                                {header}
                                            </Text>

                                            {
                                                solutions[index].dragDropChoices[groupIndex].map((label: any) => {
                                                    return <View style={{
                                                        width: 160,
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        padding: 12,
                                                        marginRight: 20,
                                                        marginBottom: 20
                                                    }}>
                                                        <Ionicons name={"ellipsis-vertical-outline"} size={16} color="#1f1f1f" />
                                                        <Text
                                                            style={{
                                                                width: '100%',
                                                                marginLeft: 5
                                                            }}
                                                        >
                                                            {label.content}
                                                        </Text>
                                                        <Ionicons name={label.correct ? 'checkmark-circle-outline' : 'close-circle-outline'} size={16} color={label.correct ? '#35AC78' : '#ff0000'} />
                                                    </View>
                                                })
                                            }
                                        </View>)
                                    })}
                                </div> : null
                        }

                        {
                            problem.questionType === 'hotspot' ?
                            <View style={{
                                width: '100%', paddingLeft: 40, overflow: 'hidden', display: 'flex', flexDirection: 'row', justifyContent: 'center',
                            }}>
                                <View style={{
                                    maxWidth: Dimensions.get('window').width < 768 ? 300 : 400, maxHeight: Dimensions.get('window').width < 768 ? 300 : 400,
                                }}>
                                    <ImageMarker
                                        src={problem.imgUrl}
                                        markers={[...problem.hotspots, ...solutions[index].hotspotSelection].map((spot: any) => {
                                            return { top: spot.y, left: spot.x }
                                        })}
                                        onAddMarker={(marker: any) => { 
                                           return;
                                        }}
                                        markerComponent={(p: any) => {

                                            console.log("P", p)
                                            console.log("Solutions[index].hotspotSelection", solutions[index].hotspotSelection)

                                            const isSelection = solutions[index].hotspotSelection.length > 0 && (p.left === solutions[index].hotspotSelection[0].x) && (p.top === solutions[index].hotspotSelection[0].y)

                                            return <TouchableOpacity disabled={true} style={{
                                                backgroundColor: isSelection ? solutions[index].hotspotSelection[0].correct ? '#35AC78' : '#ff0000' : '#fff',
                                                height: 25, width: 25, borderColor: '#000',
                                                borderRadius: 12.5
                                            }}
                                                onPress={() => {
                                                    return;
                                                }}
                                            >
                                                <Text style={{
                                                    color: '#000', lineHeight: 25, textAlign: 'center'
                                                }}>
                                                    {isSelection ? '' : p.itemNumber}
                                                </Text>
                                            </TouchableOpacity>
                                        }}
                                    />
                                </View>
                            </View> : null
                        }

                        {!props.isOwner && problemComments[index] === '' ? null : <View style={{ width: window.screen.width < 1024 ? '100%' : '80%' , maxWidth: 400, marginLeft: 40, marginBottom: 40 }}>
                            {props.isOwner ? <TextareaAutosize
                                value={problemComments[index]}
                                placeholder='Remark'
                                minRows={3}
                                style={{ 
                                    fontFamily: 'overpass',
                                    marginTop: 20,
                                    marginBottom: 20,
                                    fontSize: 14,
                                    borderRadius: 1,
                                    paddingTop: 12,
                                    paddingBottom: 12,
                                    width: '100%',
                                    maxWidth: "100%",
                                    borderBottom: '1px solid #f2f2f2',
                                    paddingLeft: 10,
                                    paddingRight: 10
                                }}
                                onChange={(e: any) => {
                                    const updateProblemComments = [...problemComments];
                                    updateProblemComments[index] = e.target.value;
                                    setProblemComments(updateProblemComments)
                                }}
                            /> :
                                <View style={{ flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 40 }}>
                                    <Text style={{ color: '#006AFF', fontSize: 13, }}>
                                        {problemComments[index]}
                                    </Text>
                                </View>}
                        </View>}
                    </View>
                })
            }
            {!props.isOwner && !comment ? null : <View style={{ width: '100%', paddingVertical: 50, paddingHorizontal: 40, borderTopWidth: 1, borderColor: '#f2f2f2' }}>
                {!props.isOwner ? <Text style={{ width: '100%', textAlign: 'left' }}>
                    Feedback
                </Text> : null}
                {props.isOwner ? <View style={{ width: window.screen.width < 1024 ? '100%' : '80%' , maxWidth: 400 }}>
                    <TextareaAutosize
                        style={{ 
                            fontFamily: 'overpass',
                            marginTop: 20,
                            marginBottom: 20,
                            fontSize: 14,
                            paddingTop: 12,
                            borderRadius: 1,
                            paddingBottom: 12,
                            width: '100%',
                            maxWidth: "100%",
                            borderBottom: '1px solid #f2f2f2',
                        }}
                        value={comment}
                        onChange={(e: any) => setComment(e.target.value)}
                        minRows={3}
                        placeholder={"Overall Feedback"}
                    />
                </View> :
                    <Text style={{ color: '#006AFF', fontSize: 14, width: '100%', textAlign: 'left', marginTop: 40 }}>
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
                    props.isOwner && props.currentQuizAttempt !== props.activeQuizAttempt ?
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
                            lineHeight: 34,
                            color: '#006AFF',
                            fontSize: 12,
                            borderColor: '#006AFF',
                            borderWidth: 1,
                            backgroundColor: '#fff',
                            borderRadius: 15,
                            paddingHorizontal: 20,
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
                        lineHeight: 34,
                        color: 'white',
                        fontSize: 12,
                        backgroundColor: '#006AFF',
                        paddingHorizontal: 20,
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
        // borderBottomColor: '#f2f2f2',
        // borderBottomWidth: 1,
        fontSize: 14,
        paddingTop: 12,
        paddingBottom: 12,
        marginTop: 5,
        marginBottom: 20
    },
    row: { minHeight: 50, flexDirection: 'row', overflow: 'hidden', borderBottomColor: '#e0e0e0', borderBottomWidth: 1 },
    col: { width: "25%", justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: 7, },
});
