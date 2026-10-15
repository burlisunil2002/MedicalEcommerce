


/* <Target Name = "ReactBuild" BeforeTargets="Build">

      <Message Text = "Building React..." Importance="high" />

      <Exec WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui" Command="npm install" Condition="!Exists('$(MSBuildProjectDirectory)\sunilmedical-ui\node_modules')" />

      <Exec WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui" Command="npm run build" />

      <RemoveDir Directories = "$(ProjectDir)wwwroot\react" ContinueOnError="true" />

      <MakeDir Directories = "$(ProjectDir)wwwroot\react" />


      < ItemGroup >

          < ReactFiles Include="$(ProjectDir)sunilmedical-ui\build\**\*" />

      </ItemGroup>

      <Copy SourceFiles = "@(ReactFiles)" DestinationFiles="@(ReactFiles->'$(ProjectDir)wwwroot\react\%(RecursiveDir)%(Filename)%(Extension)')" SkipUnchangedFiles="true" />

  </Target> */


/* <Target Name = "PublishReact" BeforeTargets = "Publish" >

	<Message Text = "========== Building React Application ==========" Importance = "high" />

	<!--Install dependencies-->
	<Exec
      WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui"
      Command = "npm ci"
      Condition = "Exists('$(MSBuildProjectDirectory)\sunilmedical-ui\package-lock.json')" />

	<Exec
      WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui"
      Command = "npm install"
      Condition = "!Exists('$(MSBuildProjectDirectory)\sunilmedical-ui\package-lock.json')" />

	<!--Build React-->
	<Exec
      WorkingDirectory = "$(MSBuildProjectDirectory)\sunilmedical-ui"
      Command = "npm run build" />

	<!--Create publish React folder -->
	<MakeDir Directories="$(PublishDir)wwwroot\react" />

	<!-- Collect React build files -->
	<ItemGroup>
		<ReactBuildFiles Include="$(MSBuildProjectDirectory)\sunilmedical-ui\build\**\*" />
	</ItemGroup>

	<!-- Copy React build into publish folder -->
	<Copy
		SourceFiles="@(ReactBuildFiles)"
		DestinationFiles="@(ReactBuildFiles->'$(PublishDir)wwwroot\react\%(RecursiveDir)%(Filename)%(Extension)')"
		SkipUnchangedFiles="true" />

	</Target> 

 
 
 <Target Name="ReactBuild" BeforeTargets="Build">
		<Error
		  Condition="!Exists('$(ReactProjectDir)\package.json')"
		  Text="React package.json was not found at $(ReactProjectDir). Check the React folder name/path in the .csproj." />

		<Message
		  Text="Building React application from $(ReactProjectDir)"
		  Importance="high" />

		<!-- Install packages only when node_modules is missing. -->
		<Exec
		  WorkingDirectory="$(ReactProjectDir)"
		  Command="npm install"
		  Condition="!Exists('$(ReactProjectDir)\node_modules')"
		  EnvironmentVariables="NODE_OPTIONS=$(ReactNodeOptions);GENERATE_SOURCEMAP=false"
		  ContinueOnError="false" />

		<Exec
		  WorkingDirectory="$(ReactProjectDir)"
		  Command="npm run build"
		  EnvironmentVariables="NODE_OPTIONS=$(ReactNodeOptions);GENERATE_SOURCEMAP=false"
		  ContinueOnError="false" />

		<Error
		  Condition="!Exists('$(ReactBuildDir)\index.html')"
		  Text="React build output was not found at $(ReactBuildDir)\index.html. If package.json uses Vite, change ReactBuildDir from build to dist in this .csproj." />

		<RemoveDir Directories="$(ReactOutputDir)" />
		<MakeDir Directories="$(ReactOutputDir)" />

		<ItemGroup>
			<ReactBuildFiles Include="$(ReactBuildDir)\**\*" />
		</ItemGroup>

		<Copy
		  SourceFiles="@(ReactBuildFiles)"
		  DestinationFiles="@(ReactBuildFiles->'$(ReactOutputDir)\%(RecursiveDir)%(Filename)%(Extension)')"
		  SkipUnchangedFiles="true" />

		<Message
		  Text="React build copied to $(ReactOutputDir)"
		  Importance="high" />
	</Target>

 */

