import Vue from 'vue';

import App from '../interface/App.vue';

Vue.component('AgentAppRender', {
    extends: App,
    props: {
        title: {
            default: '远传 · 座位图'
        },
        movable: {
            default: false
        },
        toolbox: {
            default: false
        },
        editable: {
            default: false
        },
        gridLine: {
            default: true
        },
        header: {
            default: true
        },
        contextMenu: {
            type: Array,
            default: () => [{
                text: '显示背景网格',
                value: 'appGridLine'
            }, {
                text: '显示菜单栏',
                value: 'appHeader'
            }]
        }
    }
});
