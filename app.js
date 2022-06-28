(function(nx){

    var topology = new nx.graphic.Topology({
        // width 100% if true
        adaptive: false,
        // show icons' nodes, otherwise display dots
        showIcon: true,
        // special configuration for nodes
        nodeConfig: {
            label: 'model.name',
            iconType: 'model.device_type',
            color: 'model.color'
        },
        tooltipManagerConfig: {
            nodeTooltipContentClass: 'CustomNodeTooltip',
            linkTooltipContentClass: 'CustomLinkTooltip'
        },
        // special configuration for links
        linkConfig: {
            linkType: 'straight',
            color: 'model.color',
            sourcelabel: 'model.from',
            targetlabel: 'model.to'
        },
        // property name to identify unique nodes
        identityKey: 'id', // helps to link source and target
        // canvas size
        width: window.innerWidth - 600,
        height: window.innerHeight - 100,
        // "engine" that process topology prior to rendering
        dataProcessor: 'force',
        // moves the labels in order to avoid overlay
        enableSmartLabel: true,
        // smooth scaling. may slow down, if true
        enableGradualScaling: true,
        // if true, two nodes can have more than one link
        supportMultipleLink: true,
        // enable scaling
        scalable: true,
        //Tooltip configs
        //linkInstanceClass: 'CustomLinkClass'
    });

    var App = nx.define(nx.ui.Application, {
        methods: {
            start: function () {
                // Read topology data from variable
                topology.setData(topologyData);
                // Attach it to the document
                topology.attach(this);
            }
        }
    });

    //Create Custom Node Menu
    nx.define('CustomNodeTooltip', nx.ui.Component, {
        properties: {
            node: {},
            topology: {}
        },
        view: {
            content: [{
                tag: 'div',
                content: [{
                    tag: 'h5',
                    content: [
                    {
                        tag: 'a',
                        content: '{#node.model.name}',
                        props: {'href': '{#node.model.ssh_link}'}
                    }],
                    props: {
                        'style': 'border-bottom: dotted 1px; font-size:90%; word-wrap:normal; color:#003688'
                    }
                }, 
                {
                    tag: 'p',
                    content: [
                    {
                        tag: 'label',
                        content: 'IP: ',
                    }, 
                    {
                        tag: 'label',
                        content: '{#node.model.ip}',
                    }
                    ],
                    props: {
                        'style': 'font-size:80%;'
                    }
                },
                {
                    tag: 'p',
                    content: [
                    {
                        tag: 'label',
                        content: 'Device Type: ',
                    }, 
                    {
                        tag: 'label',
                        content: '{#node.model.device_type}',
                    }],
                    props: {
                        'style': 'font-size:80%;'
                    }
                }],
            props: {
                'style': 'width: 150px;'
            }
        }]}
    });

    nx.define('Tooltip.Node', nx.ui.Component, {
        view: function(view){
            view.content.push({
            });
            return view;
        },
        methods: {
            attach: function(args) {
                this.inherited(args);
                this.model();
            }
        }
    });

    nx.define('CustomLinkTooltip', nx.ui.Component, {
        properties: {
            link: {},
            topology: {}
        },
        view: {
            content: [{
                tag: 'div',
                content: [{
                    tag: 'p',
                    content: [
                        {
                        tag: 'label',
                        content: 'Source Device: ',
                    }, {
                        tag: 'label',
                        content: '{#link.model.source.name}',
                    }
                    ],
                    props: {
                        "style": "font-size:80%;"
                    }
                }, {
                    tag: 'p',
                    content: [
                        {
                        tag: 'label',
                        content: 'Target Device: ',
                    }, {
                        tag: 'label',
                        content: '{#link.model.target.name}',
                    }
                    ],
                    props: {
                        "style": "font-size:80%;"
                    }
                }, {
                    tag: 'p',
                    content: [
                        {
                        tag: 'label',
                        content: 'Source Interface: ',
                    }, {
                        tag: 'label',
                        content: '{#link.model.source.from}',
                    }
                    ],
                    props: {
                        "style": "font-size:80%;"
                    }
                }, {
                    tag: 'p',
                    content: [
                        {
                        tag: 'label',
                        content: 'Target Node ID: ',
                    }, {
                        tag: 'label',
                        content: '{#link.model.target.id}',
                    }
                    ],
                    props: {
                        "style": "font-size:80%;"
                    }
                }
            ],
            props: {
                "style": "width: 150px;"
            }
        }]
        }
    });

    nx.define('Tooltip.Link', nx.ui.Component, {
        view: function(view){
            view.content.push({
            });
            return view;
        },
        methods: {
            attach: function(args) {
                this.inherited(args);
                this.model();
            }
        }
    });

    nx.define('CustomLinkClass', nx.graphic.Topology.Link, {
        properties: {
            sourcelabel: null,
            targetlabel: null
        },
        view: function(view) {
            view.content.push({
                name: 'source',
                type: 'nx.graphic.Text',
                props: {
                    'class': 'sourcelabel',
                    'alignment-baseline': 'text-after-edge',
                    'text-anchor': 'start'
                }
            }, {
                name: 'target',
                type: 'nx.graphic.Text',
                props: {
                    'class': 'targetlabel',
                    'alignment-baseline': 'text-after-edge',
                    'text-anchor': 'end'
                }
            });
            
            return view;
        },
        methods: {
            update: function() {

                this.inherited();
                
                var el, point;
                
                var line = this.line();
                var angle = line.angle();
                var stageScale = this.stageScale();
                
                // pad line
                line = line.pad(18 * stageScale, 18 * stageScale);

                if (this.sourcelabel()) {
                    el = this.view('source');
                    point = line.start;
                    el.set('x', point.x);
                    el.set('y', point.y);
                    el.set('text', this.sourcelabel());
                    el.set('transform', 'rotate(' + angle + ' ' + point.x + ',' + point.y + ')');
                    el.setStyle('font-size', 12 * stageScale);
                }
                
                if (this.targetlabel()) {
                    el = this.view('target');
                    point = line.end;
                    el.set('x', point.x);
                    el.set('y', point.y);
                    el.set('text', this.targetlabel());
                    el.set('transform', 'rotate(' + angle + ' ' + point.x + ',' + point.y + ')');
                    el.setStyle('font-size', 12 * stageScale);
                }

                if (this.sourcelabel() == "GigabitEthernet1/0/48") {
                    console.log(this)
                }
            }
        }
    });

	saveButton = function(){
		topologyData = topology.graph().getData()
		console.log(topologyData)

		var hiddenElement = document.createElement('a');

		hiddenElement.href = 'data:text/javascript;charset=utf-8,var topologyData = ' + encodeURIComponent(JSON.stringify(topologyData)) + ";\nvar hosts = " + encodeURIComponent(JSON.stringify(hosts)) + ";\nvar aps = " + encodeURIComponent(JSON.stringify(aps));
		hiddenElement.target = '_blank';
		hiddenElement.download = 'data.js';
		hiddenElement.click();
	};
    
    if (!(topologyData['nodes'][0].hasOwnProperty('x'))){
		var layout = topology.getLayout('hierarchicalLayout');
		layout.direction('vertical');
		layout.sortOrder(['router', 'coreswitch', 'switch']);
		layout.levelBy(function(node, model) {
			return model.get('device_type');
		});
		topology.activateLayout('hierarchicalLayout');
	};
    
    var app = new App();

    app.start();

	// app must run inside a specific container. In our case this is the one with id="topology-container"
	app.container(document.getElementById('topology-container'));

})(nx);