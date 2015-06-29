module.exports = function (grunt) {

    var serverPort = 8888;
    var livereloadPort = 35729;

    var srcFolder = "src";
//    var buildFolder = "build";
//    var tmpFolder = "tmp";

    grunt.initConfig({
//        clean: [buildFolder],
//        copy: {
//            build: {
//                files: createFilesArray("vendor")
//            }
//        },
//        autoprefixer: {
//            options: {
//                browsers: [
//                    "chrome >= 40",
//                    "firefox >= 31",
//                    "safari >= 7"
//                ]
//            },
//            dev: {
//                expand: true,
//                cwd: srcFolder + "/css",
//                src: "**.css",
//                dest: tmpFolder + "/css"
//            },
//            build: {
//                expand: true,
//                cwd: srcFolder + "/css",
//                src: "**.css",
//                dest: buildFolder + "/css"
//            }
//        },
//        processhtml: {
//            build: {
//                expand: true,
//                cwd: srcFolder,
//                src: "*.html",
//                dest: buildFolder
//            }
//        },
        connect: {
            dev: {
                options: {
                    port: serverPort,
                    livereload: livereloadPort
                }
            }
        },
        watch: {
            options: {
                spawn: false,
                forever: false,
                livereload: livereloadPort
            },
            html: {
                files: srcFolder + "/*.html"
            },
            css: {
//                options: {
//                    atBegin: true
//                },
//                tasks: "autoprefixer:dev",
                files: srcFolder + "/css/**.css"
            },
            js: {
                files: srcFolder + "/js/**.js"
            }
        }
    });

//    grunt.loadNpmTasks("grunt-processhtml");
//    grunt.loadNpmTasks("grunt-autoprefixer");
//    grunt.loadNpmTasks("grunt-contrib-clean");
//    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-connect");

    grunt.registerTask("default", [
        "connect",
        "watch"
    ]);

//    grunt.registerTask("build", [
//        "clean",
//        "copy",
//        //"autoprefixer:build",
//        "processhtml:build"
//    ]);
//
//    function createFilesArray() {
//        return [].slice.call(arguments).map(function(folderName) {
//            return {
//                expand: true,
//                cwd: srcFolder + "/" + folderName,
//                src: "**", dest: buildFolder + "/" + folderName
//            };
//        });
//    }

};