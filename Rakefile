require 'rake'
require 'listen'

SS_JS = File.join("public_html", "js", "ss.js")

task :default => :compile

task :clean do
    if File.exist?(SS_JS)
        File.unlink(SS_JS)
    end
end

task :compile => :clean do

    File.open(SS_JS, 'a') do |ssjs|

        # concat minified js
        Dir[File.join("js", "min", "*.js")].each do |file|
            ssjs.puts(File.read(file))
        end

        # minify the rest and concat it
        # to_compile = Dir.glob(File.join("js", "*.js"))
        # compiled = %x( java -jar compiler.jar #{to_compile.map{|fn| "--js #{fn} "}.join()} )
        # ssjs.puts compiled
        Dir[File.join("js", "*.js")].each do |file|
            ssjs.puts(File.read(file))
        end

    end

    puts "Wrote #{SS_JS}!"
end

task :watch do
  puts "Compiling and watching for changes in ./js"
  system 'rake compile'

  Listen.to "./js" do
    puts 'File changed, recompiling...'
    system 'rake compile'
  end
end

task :export, [:version] do |t, args|
    Dir.chdir('public_html') do
        %x( git archive master -o ../silversword_#{args.version}.zip . )
        puts "Created ../silversword_#{args.version}.zip!"
    end
end
