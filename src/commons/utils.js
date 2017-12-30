export default {
    uuid() {
        return (+new Date + Math.ceil(Math.random() * 10e8)).toString(36);
    }
}