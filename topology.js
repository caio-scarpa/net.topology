(function (nx) {
	nx.define('MyTopology', nx.graphic.Topology, {
		methods: {
			"init": function(){
				this.inherited({
					// width 100% if true
					'adaptive': false,
					// show icons' nodes, otherwise display dots
					'showIcon': true,
					// special configuration for nodes
					'nodeConfig': {
						'label': 'model.name',
						'iconType': 'model.device_type',
						'color': 'model.color'
					},
					// special configuration for links
					'linkConfig': {
						'linkType': 'straight',
                        'color': 'model.color',
						'sourcelabel': 'model.from',
            			'targetlabel': 'model.to'
					},
					// property name to identify unique nodes
					'identityKey': 'id', // helps to link source and target
					// canvas size
					'width': window.innerWidth - 600,
					'height': window.innerHeight - 100,
					// "engine" that process topology prior to rendering
					'dataProcessor': 'force',
					// moves the labels in order to avoid overlay
					'enableSmartLabel': true,
					// smooth scaling. may slow down, if true
					'enableGradualScaling': true,
					// if true, two nodes can have more than one link
					'supportMultipleLink': true,
					// enable scaling
					'scalable': true,
					//Tooltip configs
					'tooltipManagerConfig': {
                        'nodeTooltipContentClass': 'CustomNodeTooltip',
						'linkTooltipContentClass': 'CustomLinkTooltip'
                    },
					'linkInstanceClass': 'CustomLinkClass'
				});
			}
		}
	});
})(nx);