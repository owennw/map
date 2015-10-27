(function() {
    var width = 1600,
        height = 900,
        axialTilt = 0;//-23.4;

    var projection = d3.geo.orthographic()
        .translate([width / 2, height / 2])
        .scale(400)
        .clipAngle(90)
        .rotate([0, 0, axialTilt]); // yaw, pitch, roll
    var path = d3.geo.path().projection(projection).pointRadius(1.5);
    var graticule = d3.geo.graticule();
    var tooltip = d3.select('body').append('div').attr('class', 'tooltip');

    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);

    var shadow = svg.append('defs').append('radialGradient')
        .attr({
            'id': 'shadow',
            'cx': '50%',
            'cy': '50%'
        });
    shadow.append('stop')
        .attr({
            'offset': '10%',
            'stop-color': '#aaa',
            'stop-opacity': '0.89'
        });
    shadow.append('stop')
        .attr({
            'offset': '100%',
            'stop-color': '#777',
            'stop-opacity': '0'
        });

    svg.append('ellipse')
        .attr({
            'cx': 880,
            'cy': 835,
            'rx': projection.scale() * .80,
            'ry': projection.scale() * .20,
            'stroke-width': 0
        })
        .style('fill', 'url(#shadow)');

    var ocean = svg.append('defs').append('radialGradient')
        .attr('id', 'ocean')
        .attr('cx', '35%')
        .attr('cy', '20%');
    ocean.append('stop')
        .attr({
            'offset': '5%',
            'stop-color': '#def'
        });
    ocean.append("stop")
        .attr({
            'offset': '100%',
            'stop-color': "#9ac"
        });

    svg.append('path')
        .datum({ type: 'Sphere' })
        .attr('d', path)
        .style('fill', 'url(#ocean)');

    d3.json('world_fewer.json', function(error, world) {
        if (error) {
            return console.error(error);
        }

        var countries = topojson.feature(world, world.objects.countries);
        var capitals = topojson.feature(world, world.objects.cities);

        var allCountries = svg.selectAll('land')
            .data(countries.features);
        var allCapitals = svg.selectAll('city')
            .data(capitals.features);

        var render = function(path) {
            allCountries.enter()
                .append('path')
                .attr('d', path)
                .attr('class', function(d) { return 'country ' + d.id; })
                .on('mouseover', function(d) {
                    tooltip.text(d.properties.name)
                        .style('left', (d3.event.pageX + 7) + 'px')
                        .style('top', (d3.event.pagyY - 15) + 'px')
                        .style('display', 'block')
                        .style('opacity', 1);
                })
                .on('mouseout', function(d) {
                    tooltip
                        .style('opacity', 0)
                        .style('display', 'none');
                })
                .on('mousemove', function(d) {
                    tooltip.style('left', (d3.event.pageX + 7) + 'px').style('top', (d3.event.pageY - 15) + 'px');
                });

            var capitalGroups = allCapitals.enter().append('g');
            capitalGroups.append('path')
                .attr('d', path)
                .attr('class', 'city');

            var centerPos = projection.invert([width / 2, height / 2]);
            var arc = d3.geo.greatArc();

            capitalGroups.append('text')
                .attr('class', 'city-label')
                .attr('transform', function (d) {
                    var local = projection(d.geometry.coordinates);
                    x = local[0];
                    y = local[1];
                    var offset = x < width / 2 ? -7 : 7;
                    return 'translate(' + (x + offset) + ',' + (y - 4) + ')rotate(' + -axialTilt + ')';
                })
                .attr('text-anchor', function(d) {
                    // globe left -> text left
                    // globe middle - text middle
                    // globe right -> text right
                    var x = projection(d.geometry.coordinates)[0];
                    return x < width / 2 - 100 ? 'end' :
                        x < width / 2 + 100 ? 'middle' :
                        'start';
                })
                .style('display', function(d) {
                    // This prevents the cities not visible on the globe from appearing
                    var d = arc.distance({ source: d.geometry.coordinates, target: centerPos });

                    // 1.57 is ~ half of pi
                    return (d > 1.57) ? 'none' : 'inline';
                })
                .text(function (d) { return d.properties.name; });

            svg.append('path')
                .datum(graticule)
                .attr('class', 'graticule noclicks')
                .attr('d', path);
        };

        render(path);

        //d3.timer(function(elapsed) {
        //    projection.rotate([0.2 * elapsed, 0, axialTilt]);
        //    path = d3.geo.path().projection(projection);
        //    render(path);
        //    return true;
        //}, 1000)
    })
}());
