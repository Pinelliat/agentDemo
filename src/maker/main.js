import Vue from 'vue';

import App from '../interface/App.vue';

Vue.component('AgentAppMaker', {
    extends: App,
    props: {
        editable: {
            default: true
        },
        header: {
            default: true
        },
        grid: {
            default: true
        },
        toolbox: {
            default: true
        },
        gridLine: {
            default: true
        },
        gridRuleLine: {
            default: true
        },
        freeDrop: {
            default: false
        },
        contextMenu: {
            type: Array,
            default: () => [{
                text: '显示背景网格',
                value: 'appGridLine'
            }, {
                text: '显示网格对齐线',
                value: 'appGridRuleLine'
            }, {
                text: '显示菜单栏',
                value: 'appHeader'
            }, {
                text: '显示部件面板',
                value: 'appToolbox'
            }, {
                text: '自由拖放',
                value: 'appFreeDrop'
            }]
        }
    }
});
