(function() {
    var width = 1600,
        height = 900;

    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);

    var projection = d3.geo.orthographic()
        .translate([width / 2, height / 2])
        .scale(400)
        .clipAngle(90)
        .rotate([0, 0, -23.4]); // yaw, pitch, roll

    d3.json('world.json', function(error, world) {
        if (error) {
            return console.error(error);
        }

        var subunits = topojson.feature(world, world.objects.subunits),
            path = d3.geo.path().projection(projection);

        svg.selectAll('.subunit')
            .data(topojson.feature(world, world.objects.subunits).features)
            .enter().append('path')
            .attr('class', function(d) { return 'subunit ' + d.id; })
            .attr('d', path);
    })
}());
