import utils from '../commons/utils';

//
export default class Struct {

    constructor(props) {

        Object.assign(this, {
            width: 61,
            height: 61,
            left: 0,
            top: 0,
            src: '',
            name: ''
        }, props);

        if (!this.id) {
            this.id = utils.uuid();
        }

    }


}
