import React, { useState, useEffect } from 'react';

const ROOM_ID = 'dd746cc3-583b-4d70-8d83-119408f7909d';

const Whiteboard: React.FunctionComponent<{ [label: string]: any }> = (props: any) => {
    useEffect(() => {
        let pixel = new window.Comet({
            room: ROOM_ID,
            key: 'IQqlQjZNJzWmbVz1UkcQWOSwO9YxtDEpo2kWOEwV',
            name: 'Emilia Birch',
            permissions: 'RW', // optional.
            zoom_min: 0.1, // optional.
            zoom_max: 3, // optional.
            wheel: 'zoom', // optional.
            recenter_behaviour: 'fit', // optional.
            // css: 'https://your-domain/custom-styles.css' // optional.
        });
    }, []);

    return <div id="comet-container" className="w-full min-h-coursework"></div>;
};

export default Whiteboard;
