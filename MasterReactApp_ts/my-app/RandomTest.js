import * as Y from "yjs";

const doc = new Y.Doc();
const moodMap = doc.getMap("moodMap");

moodMap.set("sad", "0");
moodMap.set("neutral", "5");
moodMap.set("happy", "10");
moodMap.set("default", "-1");


const switchMap = (mood) => {
    if(moodMap.has(mood)){
        return moodMap.get(mood);
    }
    return moodMap.get("default");
}

console.log(switchMap("sad"));
console.log(switchMap("neutral"));
console.log(switchMap("happy"));
console.log(switchMap("angry"));